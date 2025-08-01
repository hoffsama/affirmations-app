// Global variables to store all affirmations and track the currently displayed one
let allAffirmations = [];
let currentAffirmationIndex = 0; // Tracks which affirmation is currently shown

// Wait for HTML to load, then run initApp
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Fetch and display affirmations when the app initializes
    fetchAffirmations();

    // Get references to our navigation buttons
    const prevBtn = document.getElementById('prev-affirmation-btn');
    const nextBtn = document.getElementById('next-affirmation-btn');

    // Add click event listeners to the navigation buttons
    if (prevBtn) prevBtn.addEventListener('click', showPreviousAffirmation);
    if (nextBtn) nextBtn.addEventListener('click', showNextAffirmation);

    // Get reference to the Add Affirmation button
    const addAffirmationBtn = document.getElementById('add-affirmation-btn');
    // Add click event listener to the Add button
    if (addAffirmationBtn) addAffirmationBtn.addEventListener('click', handleAddAffirmation);
}

// Function to fetch affirmations from the API Gateway
async function fetchAffirmations() {
    try {
        // Make a GET request to your Gateway's /affirmations endpoint
        const response = await fetch('http://localhost:3000/affirmations'); //store the response for try to get the affirmations data
        if (!response.ok) {
            // If not successful, throw an error with the status
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON response into a JavaScript array
        const affirmations = await response.json(); //parse affirmations into js array
        // Log the fetched affirmations to the console for verification
        console.log('Fetched affirmations:', affirmations);

        // Store all fetched affirmations in the global variable
        allAffirmations = affirmations; // Store fetched data globally

        // Now that we have the data, display the first (or current) affirmation
        displayCurrentAffirmation(); 

    } catch (error) {
        // Catch and log any errors that occur during the fetch operation
        console.error('Error fetching affirmations:', error);
        // Display a user-friendly message on the page if fetching fails
        const appContainer = document.querySelector('#affirmations-container'); // Corrected selector
        if (appContainer) {
            appContainer.innerHTML = '<p>Failed to load affirmations. Please try again later.</p>';
        } else {
            document.body.innerHTML += '<p>Failed to load affirmations. Please try again later.</p>';
        }
    }
}

// Displays the affirmation at the currentAffirmationIndex
function displayCurrentAffirmation() {
    const container = document.getElementById('affirmations-container');
    container.innerHTML = ''; // Clear previous content

    if (allAffirmations.length === 0) {
        container.innerHTML = '<p>No affirmations found. Add some!</p>';
        return;
    }

    // Ensure currentAffirmationIndex is within valid bounds after array changes
    if (currentAffirmationIndex < 0) {
        currentAffirmationIndex = allAffirmations.length - 1;
    } else if (currentAffirmationIndex >= allAffirmations.length) {
        currentAffirmationIndex = 0;
    }

    // Get the single affirmation to display
    const affirmationToDisplay = allAffirmations[currentAffirmationIndex];
    if (!affirmationToDisplay) { // Fallback if index is out of bounds (e.g. if array becomes empty)
        container.innerHTML = '<p>Error: Affirmation not found for display.</p>';
        return;
    }

    // Render this single affirmation
    renderAffirmation(affirmationToDisplay);
}


// Renders a SINGLE affirmation (text, tags, ratings, actions)
function renderAffirmation(affirmation) {
    const container = document.getElementById('affirmations-container');
    // We already cleared the container in displayCurrentAffirmation.

    const affirmationWrapper = document.createElement('div');
    affirmationWrapper.classList.add('ratings-wrapper');
    
    // Affirmation Text (editable)
    const affirmationText = document.createElement('h4');
    affirmationText.textContent = affirmation.text;
    affirmationText.setAttribute('contenteditable', 'false'); // Initially not editable
    affirmationWrapper.appendChild(affirmationText);

    // Tags Container (editable)
    const tagsContainer = document.createElement('div');
    tagsContainer.classList.add('tags-container');
    const tagsInput = document.createElement('input'); // Input for editing tags
    tagsInput.type = 'text';
    tagsInput.classList.add('tag-input');
    tagsInput.value = (affirmation.tags && affirmation.tags.length > 0) ? affirmation.tags.join(', ') : '';
    tagsInput.style.display = 'none'; // Hidden by default
    tagsContainer.appendChild(tagsInput);

    const currentTagsDisplay = document.createElement('div'); // Div for displaying current tags
    if (affirmation.tags && affirmation.tags.length > 0) {
        affirmation.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.classList.add('tag');
            tagSpan.textContent = tag;
            currentTagsDisplay.appendChild(tagSpan);
        });
    } else {
        currentTagsDisplay.innerHTML = '<span class="tag">No Tags</span>';
    }
    tagsContainer.appendChild(currentTagsDisplay);
    affirmationWrapper.appendChild(tagsContainer);

    // Ratings Container
    const ratingsContainer = document.createElement('div');
    ratingsContainer.classList.add('ratings');
    ratingsContainer.dataset.affirmationid = affirmation.id; 
    
    for (let i = 1; i <= 10; i++) {
        const starSpan = document.createElement('span');
        starSpan.innerHTML = '&#129655;'; 
        starSpan.dataset.rating = i;
        
        // Add click event listener to each star
        starSpan.addEventListener('click', async function() {
            const clickedRating = this.dataset.rating;
            const clickedAffirmationId = this.parentElement.dataset.affirmationid;
            console.log(`Rating ${clickedRating} for affirmation ID: ${clickedAffirmationId}`);

            // Visually update hearts on click
            const allHeartsInContainer = this.parentElement.querySelectorAll('span');
            for (let j = 0; j < allHeartsInContainer.length; j++) {
                if (parseInt(allHeartsInContainer[j].dataset.rating) <= parseInt(clickedRating)) {
                    allHeartsInContainer[j].setAttribute('data-clicked', 'true');
                } else {
                    allHeartsInContainer[j].removeAttribute('data-clicked');
                }
            }

            // Send rating to the API Gateway
            try {
                const response = await fetch(`http://localhost:3000/affirmations/${clickedAffirmationId}/rate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ hearts: clickedRating })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }

                const result = await response.text();
                console.log('Rating saved successfully:', result);

                // Re-fetch affirmations to get updated ratings data for potential display
                await fetchAffirmations(); 

            } catch (error) {
                console.error('Error sending rating:', error);
                alert('Failed to save rating. Please try again.');
            }
        });
        
        ratingsContainer.appendChild(starSpan);
    }
    affirmationWrapper.appendChild(ratingsContainer);

    // Action Buttons (Edit/Save/Delete)
    const actionButtonsContainer = document.createElement('div');
    actionButtonsContainer.classList.add('action-buttons');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    actionButtonsContainer.appendChild(editBtn);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.classList.add('save-btn');
    saveBtn.style.display = 'none'; // Hide save button initially
    actionButtonsContainer.appendChild(saveBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    actionButtonsContainer.appendChild(deleteBtn);

    affirmationWrapper.appendChild(actionButtonsContainer);

    // --- Event Listeners for Edit/Save/Delete Buttons ---
    editBtn.addEventListener('click', () => {
        affirmationText.setAttribute('contenteditable', 'true'); // Make text editable
        affirmationText.focus(); // Focus on text for immediate editing
        currentTagsDisplay.style.display = 'none'; // Hide current tags
        tagsInput.style.display = 'inline-block'; // Show tag input
        editBtn.style.display = 'none'; // Hide edit button
        saveBtn.style.display = 'inline-block'; // Show save button
        deleteBtn.style.display = 'none'; // Hide delete button during edit
    });

    saveBtn.addEventListener('click', async () => {
        const updatedText = affirmationText.textContent.trim();
        const updatedTagsString = tagsInput.value.trim();
        const updatedTags = updatedTagsString ? updatedTagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

        // Send PUT request to update affirmation
        try {
            const response = await fetch(`http://localhost:3000/affirmations/${affirmation.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: updatedText, tags: updatedTags })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            console.log('Affirmation updated successfully.');
            alert('Affirmation updated!');
            await fetchAffirmations(); // Re-fetch to update local data and display

        } catch (error) {
            console.error('Error updating affirmation:', error);
            alert('Failed to update affirmation. Please try again.');
        } finally {
            // Revert UI state regardless of success/failure
            affirmationText.setAttribute('contenteditable', 'false');
            currentTagsDisplay.style.display = 'block'; // Show tags display
            tagsInput.style.display = 'none'; // Hide tag input
            editBtn.style.display = 'inline-block'; // Show edit button
            saveBtn.style.display = 'none'; // Hide save button
            deleteBtn.style.display = 'inline-block'; // Show delete button
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this affirmation?')) {
            return; // User cancelled
        }
        try {
            const response = await fetch(`http://localhost:3000/affirmations/${affirmation.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            console.log('Affirmation deleted successfully.');
            alert('Affirmation deleted!');
            // Decrement index if current one deleted and not first one
            if (currentAffirmationIndex >= allAffirmations.length -1 && allAffirmations.length > 1) {
                currentAffirmationIndex--; 
            } else if (allAffirmations.length === 1) {
                currentAffirmationIndex = 0; // if only one was left and deleted
            }
            await fetchAffirmations(); // Re-fetch to update local data and display

        } catch (error) {
            console.error('Error deleting affirmation:', error);
            alert('Failed to delete affirmation. Please try again.');
        }
    });

    container.appendChild(affirmationWrapper);

    // Apply saved ratings if any exist for this affirmation (calls applySavedRating function)
    applySavedRating(affirmation);
}

// Applies the last saved rating to the displayed hearts
function applySavedRating(affirmation) {
    if (affirmation.ratings && affirmation.ratings.length > 0) {
        // Find the last rating for this affirmation
        const lastRating = affirmation.ratings[affirmation.ratings.length - 1];
        const heartsValue = parseInt(lastRating.hearts);

        if (!isNaN(heartsValue) && heartsValue > 0) {
            // The ratingsContainer for the current affirmation might not be direct child if re-rendered
            const ratingsContainer = document.querySelector(`[data-affirmationid="${affirmation.id}"]`);
            if (ratingsContainer) {
                const allHearts = ratingsContainer.querySelectorAll('span');
                for (let i = 0; i < allHearts.length; i++) {
                    if (parseInt(allHearts[i].dataset.rating) <= heartsValue) {
                        allHearts[i].setAttribute('data-clicked', 'true');
                    } else {
                        allHearts[i].removeAttribute('data-clicked');
                    }
                }
            }
        }
    }
}

// Function to show the next affirmation in the list
function showNextAffirmation() {
    currentAffirmationIndex++;
    displayCurrentAffirmation();
}

// Function to show the previous affirmation in the list
function showPreviousAffirmation() {
    currentAffirmationIndex--;
    displayCurrentAffirmation();
}

// NEW FUNCTION: Handles submission of a new affirmation
async function handleAddAffirmation() {
    const affirmationTextInput = document.getElementById('new-affirmation-text');
    const affirmationTagsInput = document.getElementById('new-affirmation-tags');

    const text = affirmationTextInput.value.trim();
    const tagsString = affirmationTagsInput.value.trim();

    if (!text) {
        alert('Please enter affirmation text.');
        return;
    }

    const id = `affirmation-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    const newAffirmationData = { id, text, tags };

    // Send the new affirmation data to the API Gateway
    try {
        console.log('Sending new affirmation to Gateway:', newAffirmationData);
        const response = await fetch('http://localhost:3000/affirmations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAffirmationData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.text();
        console.log('New affirmation submission accepted by Gateway:', result);
        alert('Affirmation submitted! It will appear shortly.');

        // Clear the form fields after successful submission
        affirmationTextInput.value = '';
        affirmationTagsInput.value = '';

        // Re-fetch all affirmations to include the newly added one
        await fetchAffirmations(); 

    } catch (error) {
        console.error('Error adding new affirmation:', error);
        alert('Failed to add affirmation. Please try again.');
    }
}