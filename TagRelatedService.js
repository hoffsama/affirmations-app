const zmq = require("zeromq");
const fs = require('fs');
const path = require('path');


function addTag(currentAffirmation) {
    try {
        const tag = message.substring(8);
        currentAffirmation.tags.push(tag);
        return 'success';
    } catch (error) {
        console.error('Error adding tag to affirmation:', error);
        return 'error';
    }
}

async function run() {
    // Use a Reply socket to respond to the main service
    const sock = new zmq.Reply();
    await sock.bind("tcp://127.0.0.1:3001");

    console.log("Worker bound to port 3001");

    for await (const [msg] of sock) {
        const message = msg.toString();
        let reply;

        if (message.startsWith("add tag:")) {
            console.log("Adding tag to affirmation...");
            const tag = message.substring(8);
            reply = addTag(currentAffirmation);
            console.log("Tag addition result:", reply);
        } else if (message.startsWith("exit")) {
            console.log("Worker exiting...");
            await sock.send('exiting');
            break;
        } else {
            console.log("Work is not for me!");
            reply = 'invalid';
        }
        
        await sock.send(reply);
    }
    sock.close();
}

run();