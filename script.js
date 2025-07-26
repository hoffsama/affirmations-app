let hearts = document.querySelectorAll(".ratings span");

let affirmations = document.querySelectorAll(".ratings");

let ratings = [];

for(let heart of hearts){
    heart.addEventListener("click", function(){
        this.setAttribute("data-clicked", "true");
    });
}