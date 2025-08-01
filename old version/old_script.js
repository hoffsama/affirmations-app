let hearts = document.querySelectorAll(".ratings span");

let affirmations = document.querySelectorAll(".ratings");

let ratings = [];

for(let heart of hearts){
    heart.addEventListener("click", function(){
        this.setAttribute("data-clicked", "true");

        let rating = this.dataset.rating;
        console.log(this.dataset.rating);
        let affirmationID = this.parentElement.dataset.affirmationid;
        console.log(affirmationID, rating);


        let affirmationRatings = {
            "hearts": rating,
            "affirmation-id": affirmationID
        }

        ratings.push(affirmationRatings);
        localStorage.setItem("rating",JSON.stringify(ratings));



    });
}


if(localStorage.getItem("rating")){
    console.log("Local storage for rating was found");
    ratings = JSON.parse(localStorage.getItem("rating"));
    for(let rating of ratings){
        for (let affirmation of affirmations){
            if(rating["affirmation-id"] == affirmation.dataset.affirmationid){
                let reversedHearts = Array.from(affirmation.children).reverse();
                let index = parseInt(rating["hearts"]) - 1;
                reversedHearts[index].setAttribute("data-clicked", "true");
            }
        }
    }
}

