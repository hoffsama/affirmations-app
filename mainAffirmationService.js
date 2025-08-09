const zmq = require("zeromq");  

const fs = require('fs');
const path = require('path');
const prompt = require("prompt-sync")({sigint: true});

var affirmationsjson = fs.readFileSync(path.resolve('.', './affirmation_db.json'), {'encoding': 'utf-8'});
var affirmationsparsed = JSON.parse(affirmationsjson);

var currentAffirmation = null;
var previousAffirmation = null;

//set up sockets for various microservices
const addAffirmationSocket = new zmq.Push();
addAffirmationSocket.connect("tcp://127.0.0.1:3001");
const deleteAffirmationSocket = new zmq.Push();
deleteAffirmationSocket.connect("tcp://127.0.0.1:3002");

function refreshAffirmations(){

    affirmationsjson = fs.readFileSync(path.resolve('.', './affirmation_db.json'), {'encoding': 'utf-8'});
    affirmationsparsed = JSON.parse(affirmationsjson);
    if(affirmationsjson == null || affirmationsparsed == null || affirmationsjson == "" || affirmationsparsed == "" || affirmationsjson == "[]" || affirmationsparsed == "[]" || affirmationsjson == "{}" || affirmationsparsed == "{}" || affirmationsjson == "[ ]" || affirmationsparsed == "[ ]" || affirmationsjson == "null" || affirmationsparsed == "null" || affirmationsjson == "undefined" || affirmationsparsed == "undefined"){
        console.log("Affirmation database is empty");
        return;
    }
}

async function addAffirmation(someText) {
    addAffirmationSocket.send(`add text:${someText}`);
}

async function microserviceDeleteAffirmation(someText) {
    deleteAffirmationSocket.send(`delete affirmation:${someText}`);
}



function getRandomAffirmation(){
    if(currentAffirmation != null){
        previousAffirmation = currentAffirmation;
    }
    refreshAffirmations();
    var randAffirmationIndex= Math.floor(Math.random() * affirmationsparsed.length);
    currentAffirmation = affirmationsparsed[randAffirmationIndex];
    console.log("currentAffirmation was set to be: ",currentAffirmation);
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
    console.log('The use of characters as opposed to numbers or words to navigate this program is for convenience, each letter is associated with the main purpose of clicking it, and will allow for easy navigation of the whole platform after a small learning curve.');
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
    console.clear();
    console.log('');
    console.log('✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿');
    console.log('');
    console.log(currentAffirmation.text);
    console.log('');
    console.log('✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿');
    console.log('');
    console.log('(a) View an affirmation. NOTE: This is pure random so you may see affirmations you have already seen before affirmations you have not seen yet');
    console.log('(n) Add a new affirmation');
    console.log('(p) Go to previous affirmation. NOTE: You cannot return to the current affirmation(next is random), and you can only go back one affirmation');
    console.log('(w) Go back to welcome page');
    console.log('(i) Get more information about this application, and how it works.');
    console.log('(e) Exit the program');    
    console.log('');
}



function welcomePage(){
    console.clear();
    printWelcomeMessage();
}

function infoPage(){
    console.clear();
    printMoreInfo();
}

function affirmationPage(){  
    getRandomAffirmation();
    printAffirmationAndOptions();
}

function previousAffirmationPage(){
    getPreviousAffirmation();
    printAffirmationAndOptions();
}

function exitProgram(){
    console.clear();
    console.log('Congratulations! You have made your life better! Goodbye :)' );
    console.log('');
    process.exit();
}

function addNewAffirmation(){
    console.clear();
    addAffirmation(prompt("Enter your new affirmation: "));
    console.log('');
    console.log('Affirmation added successfully!');
    console.log('');
    getRandomAffirmation();
    printAffirmationAndOptions();
}

function deleteAffirmation(){
    if(currentAffirmation != null){
        microserviceDeleteAffirmation(currentAffirmation.text);
        console.log('');
        console.log('Affirmation deleted successfully!');
        console.log('');
        getRandomAffirmation();
        printAffirmationAndOptions();
    }else{
        console.log('');
        console.log('✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿');
        console.log('');
        console.log('No affirmation selected!');
        console.log('');
        console.log('✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿');
        console.log('');
    }
}

function action(){

    userAction = prompt('Desired action: ');

    if(userAction == 'w'){
        welcomePage();

    } else if (userAction == 'i'){
        infoPage();

    } else if (userAction == 'a'){
        affirmationPage();

    } else if (userAction == 'p'){
        previousAffirmationPage();

    } else if (userAction == 'e') {
        exitProgram();

    } else if (userAction == 'n') {
        addNewAffirmation();
    } else if (userAction == 'd') {
        deleteAffirmation();
    }else{
        console.log('');
        console.log('✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿');
        console.log('');
        console.log('Invalid input, please try again...');
        console.log('');
        console.log('✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿');
        console.log('');
    }

}


//Program begins, loops till graceful exit is triggered

printWelcomeMessage();
while(true){
    if (action() == 0){
        break;
    }
}






