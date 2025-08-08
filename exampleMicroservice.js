const zmq = require("zeromq");

async function run() {
    const sock = new zmq.Pull();
    await sock.bind("tcp://127.0.0.1:3001");

    console.log("Worker bound to port 3001");

    for await (const [msg] of sock) {
        const message = msg.toString();
        console.log(message);
        if(message.substring(0, 9) == "add text:"){
            console.log("Adding affirmation to file...");
        } else if(message.substring(0, 4) == "exit"){
            console.log("Worker exiting...");   
            break;
        } else {
            console.log("Work is not for me!");
        }
    }
}

run();