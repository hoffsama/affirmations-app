const zmq = require("zeromq");
const fs = require('fs');
const path = require('path');

var affirmationsjson = fs.readFileSync(path.resolve('.', './affirmation_db.json'), {'encoding': 'utf-8'});
var affirmationsparsed = JSON.parse(affirmationsjson);

function deleteAffirmation(someText) {
    for (var i = 0; i < affirmationsparsed.length; i++) {
        if (affirmationsparsed[i].text == someText) {
            affirmationsparsed.splice(i, 1);
            console.log("Deleting affirmation:", someText);
            break;
        }
    }
    fs.writeFileSync(path.resolve('.', './affirmation_db.json'), JSON.stringify(affirmationsparsed, null, 2));
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
            affirmationsjson = fs.readFileSync(path.resolve('.', './affirmation_db.json'), {'encoding': 'utf-8'});
            affirmationsparsed = JSON.parse(affirmationsjson);
            console.log("Affirmation log updated: ", affirmationsparsed);
        } else if(message.startsWith("exit")){
            console.log("Worker exiting...");   
            break;
        } else {
            console.log("Work is not for me!");
        }
    }
}

run();
