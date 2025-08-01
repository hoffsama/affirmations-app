const express = require('express'); //allows library for easy abstraction of comon server functionalities
const fs = require('fs'); // Node.js built-in module for file system operations
const cors = require('cors'); //lets you bipass security issues involving accsesing different origins
const amqp = require('amqplib'); // RabbitMQ client library


const app = express(); // creates new instance of express
const SERVICE_PORT = 3001; // port that affirmations service runs from
const DATA_FILE = 'affirmations.json'; //nickname for the file that affirmations and thier data is stored in

// RabbitMQ connection details
const RABBITMQ_URL = 'amqp://guest:guest@localhost:5672'; // Default RabbitMQ URL
const QUEUE_NAME = 'new_affirmation_queue'; // The queue we'll listen to

// Middleware setup
app.use(express.json()); // This line tells Express to understand JSON data in requests for this service
app.use(cors());         // This line helps prevent security errors when the Gateway talks to this service

// --- Helper function for file operations (to reduce code duplication) ---
// This function reads, modifies, and writes the affirmations.json file
// It takes a callback function that performs the actual modification
function updateAffirmationsFile(modifierCallback, res = null) {
    fs.readFile(DATA_FILE, (err, data) => {
        let affirmations = [];
        if (err) {
            if (err.code === 'ENOENT') {
                data = '[]'; // File not found, start with empty array
            } else {
                console.error("Error reading affirmations file:", err);
                if (res) return res.status(500).send('Error reading affirmations data.');
                return; // Can't respond if no res object, just log
            }
        }

        try {
            affirmations = JSON.parse(data);
        } catch (parseErr) {
            console.error("Error parsing affirmations JSON:", parseErr);
            if (res) return res.status(500).send('Corrupted affirmations data.');
            return;
        }

        // Apply the modification logic provided by the caller
        const result = modifierCallback(affirmations); 
        // result could be { success: boolean, message: string, status: number, updated: boolean }

        fs.writeFile(DATA_FILE, JSON.stringify(result.affirmations || affirmations, null, 2), (writeErr) => {
            if (writeErr) {
                console.error("Error writing to affirmations file:", writeErr);
                if (res) return res.status(500).send('Error writing to affirmations file.');
            } else {
                console.log(result.message);
                if (res) return res.status(result.status || 200).send(result.message);
            }
        });
    });
}


// Function to connect to RabbitMQ and start consuming messages
async function consumeMessages() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: false }); // Ensure queue exists
        console.log(`Affirmations Service connected to RabbitMQ and listening for messages on: ${QUEUE_NAME}`);

        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg !== null) {
                try {
                    const newAffirmationData = JSON.parse(msg.content.toString());
                    console.log('Received new affirmation message from RabbitMQ:', newAffirmationData.id);

                    // Call the shared file update logic
                    updateAffirmationsFile((affirmations) => {
                        // Check for duplicates before adding
                        if (affirmations.some(aff => aff.id === newAffirmationData.id)) {
                            return { success: false, message: `Affirmation already exists, skipping: ${newAffirmationData.id}`, affirmations: affirmations };
                        }

                        // Add new affirmation with required structure
                        affirmations.push({ 
                            id: newAffirmationData.id,
                            text: newAffirmationData.text,
                            tags: newAffirmationData.tags || [],
                            ratings: []
                        });
                        return { success: true, message: `New affirmation added to file (from RabbitMQ): ${newAffirmationData.id}`, affirmations: affirmations };
                    });

                    channel.ack(msg); // Acknowledge message if processing was initiated (even if skipped as duplicate)

                } catch (processingError) {
                    console.error('Error processing RabbitMQ message:', processingError);
                    channel.reject(msg, false); // Reject message without re-queuing
                }
            }
        }, { noAck: false }); // 'noAck: false' means we need to manually acknowledge messages
    } catch (error) {
        console.error('Failed to connect to RabbitMQ or start consuming:', error);
        // Implement robust retry logic
    }
}
consumeMessages(); // Call the consumer function when the Affirmations Service starts


// Endpoint to get all affirmations (EXISTING)
app.get('/affirmations', (req, res) => {
    fs.readFile(DATA_FILE, (err, data) => { // Read the content of our affirmations.json file
        if (err) { // If 'err' is not null, it means an error occurred during file reading
            if (err.code === 'ENOENT') { // 'ENOENT' means "Error: No such file or directory"
                return res.status(200).json([]); // Send an empty array if the file is not found (first run scenario)
            }
            console.error("Error reading affirmations file (GET):", err); // Log the actual error for debugging
            return res.status(500).send('Error reading affirmations data.'); // Send a generic 500 error to the Gateway
        }
        
        let affirmations = []; // Initialize an empty array to hold our affirmations
        try { // Start a try block specifically for JSON parsing, as this can fail
            affirmations = JSON.parse(data); // Convert the raw file data (string) into a JavaScript array
            res.status(200).json(affirmations); // Send the parsed affirmations data back to the Gateway (and then to the browser)
        } catch (parseErr) { // If there's an error during JSON parsing (e.g., file is corrupted)
            console.error("Error parsing affirmations JSON (GET):", parseErr); // Log the specific parsing error
            res.status(500).send('Corrupted affirmations data.'); // Send a 500 error indicating a data problem
        }
    }); // This closes the fs.readFile callback function
});


// Endpoint to receive a new rating for a specific affirmation (EXISTING)
app.post('/affirmations/:id/rate', (req, res) => {
    const affirmationId = req.params.id;
    const { hearts } = req.body;

    if (!hearts) { return res.status(400).send('Rating (hearts) is required.'); }

    updateAffirmationsFile((affirmations) => {
        const affirmationToUpdate = affirmations.find(aff => aff.id === affirmationId);
        if (!affirmationToUpdate) { return { success: false, message: 'Affirmation not found.', status: 404 }; }

        affirmationToUpdate.ratings.push({ hearts: parseInt(hearts), timestamp: new Date().toISOString() });
        return { success: true, message: `Rating ${hearts} saved for ID: ${affirmationId}`, affirmations: affirmations };
    }, res);
});


// NEW ENDPOINT: To receive new affirmations from teammate's consumer service (internal call)
// This endpoint directly adds the affirmation to affirmations.json
app.post('/internal/add-affirmation', (req, res) => {
    const newAffirmation = req.body; 

    if (!newAffirmation || !newAffirmation.id || !newAffirmation.text) {
        return res.status(400).send('Affirmation must have an ID and text.');
    }

    updateAffirmationsFile((affirmations) => {
        const existingAffirmation = affirmations.find(aff => aff.id === newAffirmation.id);
        if (existingAffirmation) {
            return { success: false, message: `Affirmation with ID ${newAffirmation.id} already exists.`, status: 200 }; // Return 200 if already exists
        }

        affirmations.push({
            id: newAffirmation.id,
            text: newAffirmation.text,
            tags: newAffirmation.tags || [],
            ratings: []
        });
        return { success: true, message: `Affirmation added (via internal API): ${newAffirmation.id}`, affirmations: affirmations, status: 201 }; // 201 Created
    }, res);
});


// NEW ENDPOINT: To update an existing affirmation (text and tags)
app.put('/affirmations/:id', (req, res) => {
    const affirmationId = req.params.id;
    const { text, tags } = req.body; // Get updated text and tags

    if (!text) { return res.status(400).send('Affirmation text is required for update.'); }

    updateAffirmationsFile((affirmations) => {
        const index = affirmations.findIndex(aff => aff.id === affirmationId);
        if (index === -1) { return { success: false, message: 'Affirmation not found for update.', status: 404 }; }

        affirmations[index].text = text;
        affirmations[index].tags = tags || []; // Update tags, ensure it's an array
        
        return { success: true, message: `Affirmation ID ${affirmationId} updated.`, affirmations: affirmations };
    }, res);
});


// NEW ENDPOINT: To delete an affirmation
app.delete('/affirmations/:id', (req, res) => {
    const affirmationId = req.params.id;

    updateAffirmationsFile((affirmations) => {
        const initialLength = affirmations.length;
        const filteredAffirmations = affirmations.filter(aff => aff.id !== affirmationId);

        if (filteredAffirmations.length === initialLength) {
            return { success: false, message: 'Affirmation not found for deletion.', status: 404 };
        }
        return { success: true, message: `Affirmation ID ${affirmationId} deleted.`, affirmations: filteredAffirmations, status: 200 };
    }, res);
});


// Start the Affirmations Service server and listen on its designated port
app.listen(SERVICE_PORT, () => {
    console.log(`Affirmations Service running on http://localhost:${SERVICE_PORT}`);
});