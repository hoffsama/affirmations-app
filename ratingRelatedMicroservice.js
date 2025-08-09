const zmq = require("zeromq");
const fs = require('fs');
const path = require('path');

const db_fname = "affirmation_db.json";

function getAllAffirmations() {
    try {
        const affirmationsJson = fs.readFileSync(path.resolve('.', `./${db_fname}`), { 'encoding': 'utf-8' });
        return JSON.parse(affirmationsJson);
    } catch (e) {
        console.error("Error reading or parsing affirmation database:", e);
        return [];
    }
}

function saveAllAffirmations(allAffirmations) {
    try {
        fs.writeFileSync(path.resolve('.', `./${db_fname}`), JSON.stringify(allAffirmations, null, 2));
    } catch (e) {
        console.error("Error writing affirmation database:", e);
    }
}

function addRating(affirmationText, newRating, newTime) {
    const allAffirmations = getAllAffirmations();
    const indexToAddRating = allAffirmations.findIndex((affirmation) => affirmation.text === affirmationText);
    if (indexToAddRating !== -1) {
        if(allAffirmations[indexToAddRating].ratings == null){
            allAffirmations[indexToAddRating].ratings = [];
        }
        allAffirmations[indexToAddRating].ratings.push({rating: newRating, time: newTime});
        saveAllAffirmations(allAffirmations);
    } else {
        console.log("Issue adding rating");
    }
}

async function run() {
    const sock = new zmq.Pull();
    await sock.bind("tcp://127.0.0.1:3004");

    console.log("Worker bound to port 3004");

    for await (const [msg] of sock) {
        const message = msg.toString('utf-8');
        console.log("Received message: ",message);
        if(message.startsWith("add rating:")){
            firstDelimiter = message.indexOf("&");
            secondDelimiter = message.indexOf("@");
            affirmationText = message.substring(11,firstDelimiter);
            console.log("Affirmation text: ",affirmationText);
            newRating = message.substring(firstDelimiter + 1,secondDelimiter).trim();
            console.log("New Rating: ",newRating);
            newTime = message.substring(secondDelimiter+1);
            console.log("Timestamp: ", newTime);
            addRating(affirmationText, newRating, newTime);
            console.log("Affirmation log updated: ", getAllAffirmations());
        } else if(message.startsWith("exit")){
            console.log("Worker exiting...");   
            break;
        } else {
            console.log("Work is not for me!");
        }
    }
}


run();
