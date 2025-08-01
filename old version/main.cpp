#include <iostream>

using namespace std;

void printWelcome(){
    cout<<endl<<
        "Welcome! This is an affirmations application. Use me to track, build, and edit your beliefs! "
        "Please choose from the following options by typing the corresponding letter and pressing enter."<<endl
        <<endl<<
        "(a) Veiw an affirmation"<<endl<<
        "(i) Get more information about this application, and how it works. "
            "(You will be able to return to the homepage or procced to affirmtions afterward)"<<endl<<
        "(e) Exit the program"<<endl
        <<endl;

}

void printMoreInfo(){
    cout<<"What are affirmations?"<<endl
        <<"Affirmations are a powerful tool to build stronger neural pathways to reprogram your brain to have an "
        "easier time thinking certain thoughts. They do nothing to change the outside world, but they can "
        "completely change your perception of the world, your experience, and even yourself. In a world with so "
        "much conflicting and overwhelming information, affirmations are a great way to ground yourself, decide "
        "what you want to focus on, and how you want to think and feel as you move through the world, even, if "
        "not especially, on a subconscious level."<<endl
        <<endl<<
        "How to use this program?"<<endl
        <<"To navigate through this application you will be given text and then a list of options based on that "
        "text. To select an option you need to type the character featured within the parentheses before the listed"
        " option, for example if given the option (e) Exit program, to exit the program click the key “e” once, "
        "(without quotations) then press enter to select that option."<<endl
        <<endl
        <<"(a) Veiw an affirmation"<<endl
        <<"(w) Go back to welcome page"<<endl
        <<"(e) Exit the program"<<endl
        <<endl;

}

void preformAction(char userInput){
    if(userInput=='w'){
        printWelcome();
    }else if(userInput=='i'){
        printMoreInfo();
    }else{
        cout<< "Error: Invalid input"<<endl;
    }
    return;
}

int main () {
    printWelcome();

    while (true){
        char userChoice;
        cin>> userChoice;
        preformAction(userChoice);
    }
}