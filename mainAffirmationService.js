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

async function addAffirmation(someText) {
    affirmationSocket.send(`add text:${someText}`);
}

async function deleteAffirmation(someText) {
    affirmationSocket.send(`delete affirmation:${someText}`);
}


/*Format for affirmation modifications, 

first char is:
    0 if removing an affirmation, 1 if adding an affirmation, 2 if editing an affirmation
if editing:
    second char is:
        id of the target affirmation
    third char is:
        which part of the affirmation to edit, 0 for text, 1 for tags, 2 for ratings
    next part is:
        the new value for the part of the affirmation to edit
*/


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
    console.log('');
    console.log('✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿  ✿');
    console.log('');
    console.log(currentAffirmation);
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
    console.clear();    
    getRandomAffirmation();
    printAffirmationAndOptions();
}

function previousAffirmationPage(){
    console.clear();
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
    console.log('Enter your new affirmation: ');
    var affirmation = prompt();
    addAffirmation(affirmation);
    console.log('');
    console.log('Affirmation added successfully!');
    console.log('');
    printAffirmationAndOptions();
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
        
    }else{
        console.log('');
        console.log('Invalid input, please try again...');
        console.log('');
    }

}


//Program begins, loops till graceful exit is triggered

printWelcomeMessage();
deleteAffirmation('test1');
while(true){
    action();
}






