// ----------------------------------------------Notes Page-------------------------------------------------

let notes = localStorage.getItem("notes"); // fetch notes array from localStorage
notes = notes ? JSON.parse(notes) : []; // if not exist give an empty array

const username = JSON.parse(currentUser).username; // currentUser already been fetched in auth-guard.js.


// -----------------------------------------------NoteEditor-----------------------------------------------------

const noteEditor = document.getElementById("note-editor");
const newNote = document.getElementById("new-note-btn"); // New Note Button

let currentView = ""; //filter out Notes
renderCategories(); // render all the catagories in the starting itself on the left sidebar

// --------------------------New Note-------------------------------
newNote.addEventListener("click", () => {
    document.getElementById("empty-state").style.display = "none"; // hide the empty state text
    noteEditor.style.display = "flex"; // show the noteEditor

    // Reset all the input and selected values
    document.getElementById("note-title").value = "";
    document.getElementById("note-category").value = "";
    document.getElementById("note-content").innerHTML = "";

    selectedNoteId = null; // no note should be selected while creating a new one
    renderNotes(currentView); // render notes on the right side

    // hide the new Category input box and reset it
    newCategoryInput.style.display = "none"; 
    newCategoryInput.value = "";  
});

// -------------------------Note Category----------------------------
const noteCategorySelect = document.getElementById("note-category"); 
const newCategoryInput = document.getElementById("new-category-input"); // new manual category input

// user select a category
noteCategorySelect.addEventListener("change", () => {
    if (noteCategorySelect.value === "__new__") { 
        newCategoryInput.style.display = "block"; // show the input box and it takes its own line.
        newCategoryInput.focus(); // cursor is placed inside the input field,
    } else {
        // hide and reset the input box.
        newCategoryInput.style.display = "none"; 
        newCategoryInput.value = "";
    }
});

// ------------------------Save Button-------------------------------
const saveNoteBtn = document.getElementById("save-note-btn");
saveNoteBtn.addEventListener("click", () => { // save button is clikked

    // fetched title, content and category the user filled and generate the keys that are going to save in notes array.
    const id = crypto.randomUUID(); 
    let title = document.getElementById("note-title").value.trim();
    let content = document.getElementById("note-content").innerHTML;
    let category = document.getElementById("note-category").value;
    const createdAt = Date.now();

    // Handle all the possible errors. 
    let error = "";
    if(!title) error = "title can't be empty";
    
    // title cant be same for two notes.
    else if(    
        notes.find(
            (note) => note.username === username && note.title === title && note.id !== selectedNoteId
        )
    ) error = "title already exists";
    else{

        // set the manually made category
        if(noteCategorySelect.value === "__new__") {
            category = newCategoryInput.value.trim();
        }

        // if the user is updating, remove the previous entry and add as new.
        if(selectedNoteId !== null) {
            notes = notes.filter((note) => note.id !== selectedNoteId);
        }
        
        // push the note into notes array.
        notes.push({id, username, title, content, category, createdAt});
        localStorage.setItem("notes", JSON.stringify(notes));

        // reset all the inputs and options
        document.getElementById("note-title").value = "";
        document.getElementById("note-content").innerHTML = "";
        document.getElementById("note-category").value = "";
        newCategoryInput.value = "";

        // hide editor and show text.
        noteEditor.style.display = "none";
        document.getElementById("empty-state").style.display = "block";
        renderNotes(currentView);
        renderCategories();
    }

    document.getElementById("error").innerHTML = error; // show if any error exist.
});

// ---------------------------------Delete Button-----------------------------
const deleteNoteBtn = document.getElementById("delete-note-btn");
deleteNoteBtn.addEventListener("click", () => {
    if(!selectedNoteId) return;   // if no note id selected just return
    deleteNote(selectedNoteId);   // call delete Note
});

// -------Delete Function--------
function deleteNote(id) {
    notes = notes.filter((note) => note.id !== id); // delete the selected note
    localStorage.setItem("notes", JSON.stringify(notes));

    document.getElementById("empty-state").style.display = "block"; // show the empty-state text.
    selectedNoteId = null;  // un select the note

    noteEditor.style.display = "none"; // hide the noteEditor

    // hide and reset the input box.
    renderNotes(currentView);
    renderCategories();
}

// ------------------------------Cross Button---------------------------------
const crossEditorBtn = document.getElementById("close-editor-btn");
crossEditorBtn.addEventListener("click", () => {                      // cross button is clicked
    document.getElementById("empty-state").style.display = "flex";    // hide editor, show empty-state text
    noteEditor.style.display = "none";
    selectedNoteId = null; // un select the note

    renderNotes(currentView);
    renderCategories();

    // hide and reset the input box.
    newCategoryInput.style.display = "none"; 
    newCategoryInput.value = "";
});

// -------------------------------Render Notes-------------------------------
function renderNotes(currentView) {

    document.getElementById("cards-title").innerHTML = currentView; // set the heading text as the current view name

    let cardsGrid = document.getElementById("cards-grid");
    let userNotes = []; // this array will hold only the notes that should be shown

    if(currentView === "") {} // nothing selected yet, so keep the list empty
    else if(currentView === "All Notes") {
        
        // loop through all notes and take only the ones that belong to this user
        for(let i = 0; i < notes.length; i++) {
            if(notes[i].username === username) userNotes.push(notes[i]);
        }
    }
    else{

        // loop through all notes and take only the ones matching this user and the selected category
        for(let i = 0; i < notes.length; i++) {
            if(notes[i].username === username && notes[i].category === currentView) userNotes.push(notes[i]);
        }
    }

    // sort the notes so the newest one shows up first
    userNotes.sort((a, b) => {
        return b.createdAt - a.createdAt;
    })

    // build the html for every note card and inject it into the grid
    cardsGrid.innerHTML = `
        ${userNotes
            .map((note) => {
                return `
                    <div class="note-card ${note.id === selectedNoteId ? "active" : ""}" data-id="${note.id}">
                        <h4>${note.title}</h4>  
                        <p>${note.content}</p>
                        <span class="note-category-tag">${note.category ? note.category : "No Category"}</span>
                    </div>
                `;
            })
        .join("")}
    `;
};


let selectedNoteId = null; // keeps track of which note is currently opened in the editor

// -------------------------------Select Note-------------------------------
const cardsGrid = document.getElementById("cards-grid");
cardsGrid.addEventListener("click", (event) => { // a note card is clikked
    const card = event.target.closest(".note-card"); // find the closest note-card element that got clicked
    if(!card) return; // if click was outside any card, just return

    const id = card.dataset.id; // get the id of the clicked card
    const note = notes.find((note) => note.id === id); // find the matching note from the notes array
    if (!note) return; // if no such note exist, stop here

    selectedNoteId = note.id; // mark this note as the selected one

    document.getElementById("empty-state").style.display = "none"; // hide the empty state text
    noteEditor.style.display = "flex"; // show the noteEditor

    // fill the editor fields with the selected note's data
    document.getElementById("note-title").value = note.title;
    document.getElementById("note-content").innerHTML = note.content;

    renderNotes(currentView);
    renderCategories();
    document.getElementById("note-category").value = note.category; // set the category dropdown to this note's category

    // hide and reset the new category input box
    newCategoryInput.style.display = "none";
    newCategoryInput.value = "";
});


// -----------------------------Render Categories---------------------------
function renderCategories() {

    // get all the unique, non-empty categories that belong to the current user
    const uniqueCategories = [
        ...new Set(
            notes
                .filter(note => note.username === username)
                .map(note => note.category)
                .filter(category => category)
        )
    ];

    uniqueCategories.sort((a, b) => a.localeCompare(b)); // sort the categories alphabetically

    // render each category as a list item in the left sidebar
    const categoryList = document.getElementById("category-list");
    categoryList.innerHTML = `
        ${uniqueCategories
            .map((cg) => {
                return `<li class="${cg === currentView ? "active" : ""}" data-category="${cg}">${cg}</li>`;
            })
        .join("")}
    `;

    // also update the category dropdown options inside the note editor
    const noteCategorySelect = document.getElementById("note-category");
    const dynamicOptions = uniqueCategories
        .map((cg) => {
            return `<option value="${cg}">${cg}</option>`;
        })
        .join("");

    // add the default No Category option and the Add New Category option along with the existing ones
    noteCategorySelect.innerHTML = `
        <option value="">No Category</option>
        ${dynamicOptions}
        <option value="__new__">+ Add New Category</option>
    `;
};


// ------------------------------All Notes Button-----------------------------
const allNotes = document.getElementById("all-notes-btn");
allNotes.addEventListener("click", () => { // all notes button is clicked
    currentView = "All Notes"; // set the view to All Notes
    renderNotes(currentView); // render all the notes on the right side
    renderCategories(); // re-render categories so active class updates
})


// ------------------------------Category List Click---------------------------
const categoryList = document.getElementById("category-list");
categoryList.addEventListener("click", (event) => { // a category in the sidebar is clicked
    const item = event.target.closest("[data-category]"); // find the closest li with a data-category attribute
    if (!item) return; // if click was outside any category item, just return

    currentView = item.dataset.category; // set current view as the clicked category
    renderNotes(currentView); // render only the notes of this category
    renderCategories(); // re-render categories so active class updates
});


// search feature is left
// the card grid size is dynamic but should be static
// if possible, the resizing of editor, cardGrid and categories section.