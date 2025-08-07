const zmq = require("zeromq");  

const fs = require('fs');
const path = require('path');
const prompt = require("prompt-sync")({sigint: true});

var affirmationsjson = fs.readFileSync(path.resolve('.', './affirmations.json'), {'encoding': 'utf-8'});
var affirmationsparsed = JSON.parse(affirmationsjson);

var currentAffirmation = null;
var previousAffirmation = null;

const affirmationSocket = new zmq.Push();
affirmationSocket.connect("tcp://127.0.0.1:3001"); // Use a new port for the producer to connect to

async function addAffirmation(someAffirmation) {
    affirmationSocket.send(`add text: ${someAffirmation}`);
}


function getRandomAffirmation(){
    previousAffirmation = currentAffirmation;
    var randAffirmationIndex= Math.floor(Math.random() * affirmationsparsed.length);
    currentAffirmation = affirmationsparsed[randAffirmationIndex].text;
    return currentAffirmation;
}

function getPreviousAffirmation(){
    currentAffirmation = previousAffirmation;
    return currentAffirmation;
}

function printWelcomeMessage() {
    console.clear();
    console.log('Welcome! This is an affirmations application. Use me to track, build, and edit your beliefs! Please choose from the following options by typing the corresponding letter and pressing enter.');
    console.log('(a) View an affirmation');
    console.log('(i) Get more information about this application, and how it works.');
    console.log('(e) Exit the program');
    console.log('');
}

function printMoreInfo(){
    console.clear();
    console.log('What are affirmations?');
    console.log('Affirmations are a powerful tool to build stronger neural pathways to reprogram your brain to have an easier time thinking certain thoughts. They do nothing to change the outside world, but they can completely change your perception of the world, your experience, and even yourself. In a world with so much conflicting and overwhelming information, affirmations are a great way to ground yourself, decide what you want to focus on, and how you want to think and feel as you move through the world, even, if not especially, on a subconscious level.');
    console.log('');
    console.log('The use of characters as oposed to numbers or words to navigate this program is for convince, each letter is assosiated with the main purpose of clicking it, and will allow for easy navigation of the whole platform after a small learning curve.');
    console.log('');
    console.log('How to use this program?');
    console.log('To navigate through this application you will be given text and then a list of options based on that text. To select an option you need to type the character featured within the parentheses before the listed option, for example if given the option (e) Exit program, to exit the program click the key “e” once, (without quotations) then press enter to select that option.');
    console.log('');
    console.log('(a) View an affirmation');
    console.log('(w) Go back to welcome page');
    console.log('(e) Exit the program');    
    console.log('');
}

function printAffirmationAndOptions(){
    console.log('');
    console.log(currentAffirmation);
    console.log('');
    console.log('(a) View an affirmation. NOTE: This is pure random so you may see affirmations you have already seen before affirmations you have not seen yet');
    console.log('(n) Add a new affirmation');
    console.log('(p) Go to previous affirmation. NOTE: You cannot return to the current affirmation(next is random), and you can only go back one affirmation');
    console.log('(w) Go back to welcome page');
    console.log('(i) Get more information about this application, and how it works.');
    console.log('(e) Exit the program');    
    console.log('');
}


function action(){

    actionChar = prompt('Desired action: ');

    if(actionChar == 'w'){
        prinntWelcomeMessage();

    } else if (actionChar == 'i'){
        printMoreInfo();

    } else if (actionChar == 'a'){
        getRandomAffirmation();
        console.clear();
        printAffirmationAndOptions();

    } else if (actionChar == 'p'){
        getPreviousAffirmation();
        console.clear();
        printAffirmationAndOptions();
    
    } else if (actionChar == 'e') {
        return 0;
    } else if (actionChar == 'n') {
        console.clear();
        console.log('Enter your new affirmation: ');
        var affirmation = prompt();
        addAffirmation(affirmation);
        console.log('');
        console.log('Affirmation added successfully!');
        console.log('');
        printAffirmationAndOptions();
    }else{
        console.log('');
        console.log('Invalid input, please try again...');
        console.log('');
    }
}




//Program begins, loops till gracefull exit is triggered

printWelcomeMessage();
while(true){
    if(action() == 0){
        break;
    }
}






