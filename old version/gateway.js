const express = require('express'); //imports library for common server functionality abstracted as node express functions
const cors = require('cors'); //Cross-Origin Resource Sharing: allows safe comunncation between different ports
const path = require('path'); // Node.js module for working with file paths
const amqp = require('amqplib'); // RabbitMQ client library


const app = express();
const GATEWAY_PORT = 3000; //descriptive name for the number of the port
const AFFIRMATIONS_APP_URL = 'http://localhost:3001'; // URL of our Affirmations Service

// RabbitMQ connection details
const RABBITMQ_URL = 'amqp://guest:guest@localhost:5672'; // Default RabbitMQ URL
let channel; // This variable will hold our RabbitMQ channel

// Middleware setup
app.use(express.json()); // This line tells Express to understand JSON data in requests
app.use(cors()); // Allows browser to use my different origin points which stops security errors
app.use(express.static('.')); // This line serves HTML, CSS, and JS files of the current directory to the gateway

// Function to connect to RabbitMQ (called once when Gateway starts)
async function connectToRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        // Assert a queue: if the queue doesn't exist, RabbitMQ will create it
        // Queue should be durable for production, but false is fine for development simplicity
        await channel.assertQueue('new_affirmation_queue', { durable: false }); 
        console.log('Connected to RabbitMQ and asserted queue: new_affirmation_queue');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        // Implement robust retry logic in a real application
    }
}
connectToRabbitMQ(); // Call the connection function when the Gateway starts

// Endpoint to get all affirmations from the Affirmations Service
app.get('/affirmations', async (req, res) => {
    try {
        const response = await fetch(`${AFFIRMATIONS_APP_URL}/affirmations`); 
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error from Affirmations Service: ${response.status} - ${errorText}`);
            return res.status(response.status).send(errorText);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error forwarding GET /affirmations request:', error);
        res.status(500).send('Failed to connect to Affirmations Service.');
    }
});

// Endpoint to publish a new affirmation message to RabbitMQ
app.post('/affirmations', async (req, res) => {
    const newAffirmationData = req.body;

    if (!channel) { // Check if RabbitMQ channel is established
        console.error('RabbitMQ channel not established, cannot publish.');
        // Use 503 Service Unavailable if critical dependency (broker) is down
        return res.status(503).send('Service unavailable: Message broker not connected.'); 
    }

    try {
        // Publish the message to the 'new_affirmation_queue'
        channel.sendToQueue('new_affirmation_queue', Buffer.from(JSON.stringify(newAffirmationData)));
        console.log('New affirmation message published to RabbitMQ:', newAffirmationData.id);
        
        // Respond immediately (202 Accepted) because processing is asynchronous
        res.status(202).send('Affirmation submission accepted for processing.'); // 202 Accepted
    } catch (error) {
        console.error('Failed to publish message to RabbitMQ:', error);
        res.status(500).send('Failed to submit affirmation to broker.');
    }
});

// Endpoint to forward rating requests to Affirmations Service
app.post('/affirmations/:id/rate', async (req, res) => {
    const affirmationId = req.params.id;
    const ratingData = req.body;

    try {
        // Forward the POST request to the Affirmations Service
        const response = await fetch(`${AFFIRMATIONS_APP_URL}/affirmations/${affirmationId}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ratingData)
        });

        const responseBody = await response.text();
        res.status(response.status).send(responseBody);

    } catch (error) {
        console.error('Error forwarding rating request to Affirmations Service:', error);
        res.status(500).send('Failed to connect to Affirmations Service for rating.');
    }
});

// NEW ENDPOINT: Endpoint to forward EDIT (PUT) requests to Affirmations Service
app.put('/affirmations/:id', async (req, res) => {
    const affirmationId = req.params.id;
    const updatedAffirmationData = req.body; // Contains new text, tags

    try {
        const response = await fetch(`${AFFIRMATIONS_APP_URL}/affirmations/${affirmationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedAffirmationData)
        });

        const responseBody = await response.text();
        res.status(response.status).send(responseBody);
    } catch (error) {
        console.error('Error forwarding PUT /affirmations/:id request:', error);
        res.status(500).send('Failed to connect to Affirmations Service for update.');
    }
});

// NEW ENDPOINT: Endpoint to forward DELETE requests to Affirmations Service
app.delete('/affirmations/:id', async (req, res) => {
    const affirmationId = req.params.id;

    try {
        const response = await fetch(`${AFFIRMATIONS_APP_URL}/affirmations/${affirmationId}`, {
            method: 'DELETE'
        });

        const responseBody = await response.text();
        res.status(response.status).send(responseBody);
    } catch (error) {
        console.error('Error forwarding DELETE /affirmations/:id request:', error);
        res.status(500).send('Failed to connect to Affirmations Service for deletion.');
    }
});

// Start the API Gateway server and listen on its designated port
app.listen(GATEWAY_PORT, () => {
    console.log(`Server is running at http://localhost:${GATEWAY_PORT}`);
});