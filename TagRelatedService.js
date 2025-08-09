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

function addTag(affirmationText, newTag) {
    const allAffirmations = getAllAffirmations();
    const indexToAddTag = allAffirmations.findIndex((affirmation) => affirmation.text === affirmationText);
    if (indexToAddTag !== -1) {
        if(allAffirmations[indexToAddTag].tags == null){
            allAffirmations[indexToAddTag].tags = [];
        }
        allAffirmations[indexToAddTag].tags.push(newTag);
        saveAllAffirmations(allAffirmations);
    } else {
        console.log("Issue adding tag");
    }
}

async function run() {
    const sock = new zmq.Pull();
    await sock.bind("tcp://127.0.0.1:3003");

    console.log("Worker bound to port 3003");

    for await (const [msg] of sock) {
        const message = msg.toString('utf-8');
        console.log("Received message: ",message);
        if(message.startsWith("add tag:")){
            delimiter = message.indexOf("&");
            affirmationText = message.substring(8,delimiter);
            console.log("Affirmation text: ",affirmationText);
            newTag = message.substring(delimiter + 1).trim();
            console.log("New tag: ",newTag);
            addTag(affirmationText, newTag);
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
