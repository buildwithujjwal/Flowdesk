// ----------------------------------------------Notes Page-------------------------------------------------

let notes = localStorage.getItem("notes"); // fetch notes array from localStorage
notes = notes ? JSON.parse(notes) : []; // if not exist give an empty array

const username = JSON.parse(currentUser).username; // currentUser already been fetched in auth-gaurd.js.


// -----------------------------------------------NoteEditor-----------------------------------------------------

const noteEditor = document.getElementById("note-editor");
const newNote = document.getElementById("new-note-btn"); // New Note Button

let currentView = "All Notes"; //filter out Notes, show all notes by default
let selectedNoteId = null; // keeps track of which note is currently opened in the editor (declared up here because renderNotes uses it right away)
let searchText = ""; // whatever is typed in the search box, used by renderNotes
renderNotes(currentView); // show all the notes on the right side when the page opens
renderCategories(); // render all the catagories in the starting itself on the left sidebar

// --------------------------Unsaved Changes-------------------------------
// checks if what is in the editor is different from what is saved
function hasUnsavedChanges() {
    if(noteEditor.style.display === "none") return false; // editor is closed, nothing to lose

    const title = document.getElementById("note-title").value.trim();
    const content = document.getElementById("note-content").innerHTML;
    let category = noteCategorySelect.value;
    if(category === "__new__") category = newCategoryInput.value.trim();

    const note = notes.find((note) => note.id === selectedNoteId);
    if(note) {
        // editing an old note, compare with what was saved
        return note.title !== title || note.content !== content || note.category !== category;
    }

    // a new note, anything typed counts as a change
    const contentText = document.getElementById("note-content").textContent.trim();
    return title !== "" || contentText !== "" || category !== "";
}

// asks before throwing away unsaved changes, returns true if it is ok to go on
function okToLeaveNote() {
    if(!hasUnsavedChanges()) return true;
    return confirm("You have unsaved changes. Discard them?");
}

// browser shows its own "leave site?" popup if the user leaves the page (nav link, refresh, close tab)
window.addEventListener("beforeunload", (event) => {
    if(hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = ""; // older browsers need this line too
    }
});

// --------------------------New Note-------------------------------
newNote.addEventListener("click", () => {
    if(!okToLeaveNote()) return; // user wants to keep editing the current note

    document.getElementById("empty-state").style.display = "none"; // hide the empty state text
    noteEditor.style.display = "flex"; // show the noteEditor

    // Reset all the input and selected values
    document.getElementById("note-title").value = "";
    document.getElementById("note-category").value = "";
    document.getElementById("note-content").innerHTML = "";
    document.getElementById("error").innerHTML = ""; // clear any old error message

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
    const existingNote = notes.find(
    note => note.id === selectedNoteId &&
            note.username === username
    );

    const id = existingNote ? existingNote.id : crypto.randomUUID();
    const createdAt = existingNote ? existingNote.createdAt : Date.now(); 
    let title = document.getElementById("note-title").value.trim();
    let content = document.getElementById("note-content").innerHTML;
    let category = document.getElementById("note-category").value;

    // Handle all the possible errors. 
    let error = "";
    if(!title) error = "title can't be empty";
    
    // title cant be same for two notes (capital or small letters don't matter, so "DSA" and "dsa" are same).
    else if(
        notes.find(
            (note) => note.username === username && note.title.toLowerCase() === title.toLowerCase() && note.id !== selectedNoteId
        )
    ) error = "title already exists";

    // new category is selected but the name is left empty.
    else if(noteCategorySelect.value === "__new__" && !newCategoryInput.value.trim()) error = "category name can't be empty";
    else{

        // set the manually made category
        if(noteCategorySelect.value === "__new__") {
            category = newCategoryInput.value.trim();
        }

        // if the user is updating, remove the previous entry and add as new.
        // work on a copy, so notes only changes if saving really works.
        const updatedNotes = notes.filter((note) => note.id !== selectedNoteId);

        // push the note into the copy and save it.
        updatedNotes.push({id, username, title, content, category, createdAt});

        // localStorage has a size limit (around 5MB), setItem throws an error if it is full
        try {
            localStorage.setItem("notes", JSON.stringify(updatedNotes));
        } catch (err) {
            document.getElementById("error").innerHTML = "storage is full, note couldn't be saved";
            return; // stop here, so the note stays open in the editor and nothing is lost
        }
        notes = updatedNotes; // saved for real, now update our list

        // if we are inside a category and the note went to some other category, jump there so the note doesn't look gone
        if(currentView !== "All Notes" && category !== currentView) {
            currentView = category ? category : "All Notes";
        }

        // reset all the inputs and options
        document.getElementById("note-title").value = "";
        document.getElementById("note-content").innerHTML = "";
        document.getElementById("note-category").value = "";
        newCategoryInput.value = "";
        selectedNoteId = null; // un select the note, so its card is not highlighted anymore

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
    if(!confirm("Delete this note? This can't be undone.")) return; // ask first, so one wrong click doesn't wipe a note
    deleteNote(selectedNoteId);   // call delete Note
});

// -------Delete Function--------
function deleteNote(id) {
    notes = notes.filter((note) => note.id !== id); // delete the selected note
    localStorage.setItem("notes", JSON.stringify(notes));

    document.getElementById("empty-state").style.display = "block"; // show the empty-state text.
    selectedNoteId = null;  // un select the note

    noteEditor.style.display = "none"; // hide the noteEditor

    // re-render so the deleted note and its category go away
    renderNotes(currentView);
    renderCategories();
}

// ------------------------------Cross Button---------------------------------
const crossEditorBtn = document.getElementById("close-editor-btn");
crossEditorBtn.addEventListener("click", () => {                      // cross button is clicked
    if(!okToLeaveNote()) return; // user wants to keep editing

    document.getElementById("empty-state").style.display = "flex";    // hide editor, show empty-state text
    noteEditor.style.display = "none";
    selectedNoteId = null; // un select the note
    document.getElementById("error").innerHTML = ""; // clear any old error message

    renderNotes(currentView);
    renderCategories();

    // hide and reset the input box.
    newCategoryInput.style.display = "none"; 
    newCategoryInput.value = "";
});

// -------------------------------Render Notes-------------------------------
function renderNotes(currentView) {

    document.getElementById("cards-title").textContent = currentView; // set the heading text as the current view name (textContent so a category name can't add html)

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

    // keep only the notes whose title has the searched text
    if(searchText) {
        userNotes = userNotes.filter((note) => note.title.toLowerCase().includes(searchText));
    }

    // sort the notes so the newest one shows up first
    userNotes.sort((a, b) => {
        return b.createdAt - a.createdAt;
    })

    // nothing to show, tell the user instead of leaving it blank
    if(userNotes.length === 0) {
        cardsGrid.innerHTML = `<p class="no-notes">No notes found</p>`;
        return;
    }

    // build the html for every note card and inject it into the grid
    // preview is a div not a p, because the content has its own divs inside and a p can't hold them
    // title and category go through escapeHTML so they show as plain text, not as html
    // tabindex and role let keyboard users reach the card with Tab
    cardsGrid.innerHTML = `
        ${userNotes
            .map((note) => {
                return `
                    <div class="note-card ${note.id === selectedNoteId ? "active" : ""}" data-id="${note.id}" tabindex="0" role="button">
                        <h4>${escapeHTML(note.title)}</h4>
                        <div class="note-preview">${note.content}</div>
                        <span class="note-category-tag">${note.category ? escapeHTML(note.category) : "No Category"}</span>
                    </div>
                `;
            })
        .join("")}
    `;
};

// turns < > & " ' into safe text, so a title or category can't add its own html (or code) to the page
function escapeHTML(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}


// -------------------------------Select Note-------------------------------
const cardsGrid = document.getElementById("cards-grid");
cardsGrid.addEventListener("click", (event) => { // a note card is clikked
    const card = event.target.closest(".note-card"); // find the closest note-card element that got clicked
    if(!card) return; // if click was outside any card, just return

    const id = card.dataset.id; // get the id of the clicked card
    const note = notes.find((note) => note.id === id); // find the matching note from the notes array
    if (!note) return; // if no such note exist, stop here
    if(!okToLeaveNote()) return; // user wants to keep editing the current note

    selectedNoteId = note.id; // mark this note as the selected one

    document.getElementById("empty-state").style.display = "none"; // hide the empty state text
    noteEditor.style.display = "flex"; // show the noteEditor

    // fill the editor fields with the selected note's data
    document.getElementById("note-title").value = note.title;
    document.getElementById("note-content").innerHTML = note.content;
    document.getElementById("error").innerHTML = ""; // clear any old error message

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

    // if the category we are viewing has no notes left (last one deleted or moved), go back to All Notes
    if(currentView !== "All Notes" && !uniqueCategories.includes(currentView)) {
        currentView = "All Notes";
        renderNotes(currentView);
    }

    // render each category as a list item in the left sidebar
    // escapeHTML so names with < or " don't break the html, tabindex and role so keyboard users can reach them
    const categoryList = document.getElementById("category-list");
    categoryList.innerHTML = `
        ${uniqueCategories
            .map((cg) => {
                return `<li class="${cg === currentView ? "active" : ""}" data-category="${escapeHTML(cg)}" tabindex="0" role="button">${escapeHTML(cg)}</li>`;
            })
        .join("")}
    `;

    // also update the category dropdown options inside the note editor
    const noteCategorySelect = document.getElementById("note-category");
    const dynamicOptions = uniqueCategories
        .map((cg) => {
            return `<option value="${escapeHTML(cg)}">${escapeHTML(cg)}</option>`;
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


// ------------------------------Keyboard Support---------------------------
// categories and cards are not real buttons, so let Enter or Space open them like a click
function clickOnEnter(event) {
    if(event.key === "Enter" || event.key === " ") {
        event.preventDefault(); // stop space from scrolling the page
        event.target.click(); // run the same code as a mouse click
    }
}
categoryList.addEventListener("keydown", clickOnEnter);
cardsGrid.addEventListener("keydown", clickOnEnter);


// ------------------------------Search---------------------------------------
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", () => { // user types in the search box
    searchText = searchInput.value.trim().toLowerCase(); // small letters, so search doesn't care about capitals
    renderNotes(currentView); // show only the matching notes
});


// ------------------------------Paste as Plain Text---------------------------
// when something is pasted, keep only the plain text, so colors, fonts and images from websites don't come in
const noteContent = document.getElementById("note-content");
noteContent.addEventListener("paste", (event) => {
    event.preventDefault(); // stop the normal paste
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text); // old command but still the simplest way, and ctrl+z still works
});


// ------------------------------Other Tabs-----------------------------------
// if notes change in another tab, reload them here so saving in this tab doesn't wipe that tab's changes
window.addEventListener("storage", (event) => {
    if(event.key !== "notes") return; // some other key changed, not our problem

    notes = JSON.parse(event.newValue) || []; // newValue is null if the key got removed
    const chosenCategory = noteCategorySelect.value; // renderCategories rebuilds the dropdown, so remember what was picked
    renderNotes(currentView);
    renderCategories();
    noteCategorySelect.value = chosenCategory;
});




// ------------------------------Resize Columns-------------------------------
// drag the thin bars between the columns to make the sidebar or cards area wider or smaller
document.querySelectorAll(".resizer").forEach((resizer) => {
    resizer.addEventListener("pointerdown", (event) => {
        event.preventDefault(); // stop text from getting selected while dragging

        const column = document.querySelector(resizer.dataset.column); // the column this bar resizes
        const direction = Number(resizer.dataset.direction); // 1 = dragging right makes it wider, -1 = dragging left makes it wider
        const startX = event.clientX; // where the mouse was when the drag started
        const startWidth = column.offsetWidth; // how wide the column was when the drag started

        resizer.setPointerCapture(event.pointerId); // keep getting mouse moves even if the mouse leaves the thin bar

        resizer.onpointermove = (moveEvent) => {
            const newWidth = startWidth + (moveEvent.clientX - startX) * direction;
            column.style.width = Math.min(450, Math.max(180, newWidth)) + "px"; // keep it between 180px and 450px
        };

        resizer.onpointerup = () => {
            resizer.onpointermove = null; // drag is over, stop resizing
        };
    });
});
