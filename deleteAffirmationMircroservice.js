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

function deleteAffirmation(someText) {
    const allAffirmations = getAllAffirmations();
    const indexToDelete = allAffirmations.findIndex((affirmation) => affirmation.text === someText);
    if (indexToDelete !== -1) {
        allAffirmations.splice(indexToDelete, 1);
        saveAllAffirmations(allAffirmations);
    } else {
        console.log("Issue deleting affirmation");
    }
}

async function run() {
    const sock = new zmq.Pull();
    await sock.bind("tcp://127.0.0.1:3002");

    console.log("Worker bound to port 3002");

    for await (const [msg] of sock) {
        const message = msg.toString('utf-8');
        console.log(message);
        if(message.startsWith("delete affirmation:")){
            deleteAffirmation(message.substring(19));
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
