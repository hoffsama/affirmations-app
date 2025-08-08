const zmq = require("zeromq");
const fs = require('fs');
const path = require('path');

var affirmationsjson = fs.readFileSync(path.resolve('.', './affirmations.json'), {'encoding': 'utf-8'});
var affirmationsparsed = JSON.parse(affirmationsjson);

function deleteAffirmation(someText) {
    for (var i = 0; i < affirmationsparsed.length; i++) {
        if (affirmationsparsed[i].text == someText) {
            affirmationsparsed.splice(i, 1);
            break;
        }
    }
    fs.writeFileSync(path.resolve('.', './affirmations.json'), JSON.stringify(affirmationsparsed, null, 2));
}

async function run() {
    const sock = new zmq.Pull();
    await sock.bind("tcp://127.0.0.1:3001");

    console.log("Worker bound to port 3001");

    for await (const [msg] of sock) {
        const message = msg.toString();
        console.log(message.substring(0, 19));
        if(message.substring(0, 19) == "delete affirmation:"){
            console.log("Deleting affirmation from file...");
            deleteAffirmation(message.substring(19));
        } else if(message.substring(0, 4) == "exit"){
            console.log("Worker exiting...");   
            break;
        } else {
            console.log("Work is not for me!");
        }
    }
}

run();
