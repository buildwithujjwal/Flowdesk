let notes = localStorage.getItem("notes");
notes = notes ? JSON.parse(notes) : [];

const username = JSON.parse(currentUser).username;
const today = new Date().toISOString().split("T")[0];

const noteEditor = document.getElementById("note-editor");
const newNote = document.getElementById("new-note-btn");

const currentView = "all";
renderNotes(currentView);
renderCategories();

newNote.addEventListener("click", () => {
    document.getElementById("empty-state").style.display = "none";
    noteEditor.style.display = "flex";

    document.getElementById("note-title").value = "";
    document.getElementById("note-category").value = "";
    document.getElementById("note-content").innerHTML = "";
});

const noteCategorySelect = document.getElementById("note-category");
const newCategoryInput = document.getElementById("new-category-input");

noteCategorySelect.addEventListener("change", () => {
    if (noteCategorySelect.value === "__new__") {
        newCategoryInput.style.display = "block";
        newCategoryInput.focus();
    } else {
        newCategoryInput.style.display = "none";
        newCategoryInput.value = "";
    }
});

const saveNoteBtn = document.getElementById("save-note-btn");
saveNoteBtn.addEventListener("click", () => {

    const id = crypto.randomUUID();
    let title = document.getElementById("note-title").value.trim();
    let content = document.getElementById("note-content").innerHTML;
    let category = document.getElementById("note-category").value;
    const createdAt = Date.now();
    const updatedAt = Date.now();

    let error = "";
    if(!title) error = "title can't be empty";
    else if(    
        notes.find(
            (note) => note.username === username && note.title === title
        )
    ) error = "title already exists";
    else{

        if(noteCategorySelect.value === "__new__") {
            category = newCategoryInput.value.trim();
        }
        
        notes.push({id, username, title, content, category, createdAt, updatedAt});
        localStorage.setItem("notes", JSON.stringify(notes));

        document.getElementById("note-title").value = "";
        document.getElementById("note-content").innerHTML = "";
        document.getElementById("note-category").value = "";
        newCategoryInput.value = ""

        noteEditor.style.display = "none";
        document.getElementById("empty-state").style.display = "block";
        renderNotes("all");
    }

    document.getElementById("error").innerHTML = error;
});

function renderNotes(currentView) {

    let cardsGrid = document.getElementById("cards-grid");
    
    let userNotes = [];

    if(currentView === "all") {

        for(let i = 0; i < notes.length; i++) {
            if(notes[i].username === username) userNotes.push(notes[i]);
        }
    }

    userNotes.sort((a, b) => {
        return b.createdAt - a.createdAt;
    })

    cardsGrid.innerHTML = `
        ${userNotes
          .map((note) => {
            return `
                <div class="note-card" data-id="${note.id}">
                    <h4>${note.title}</h4>  
                    <p>${note.content}</p>
                    <span class="note-category-tag">${note.category ? note.category : "No Category"}</span>
                </div>
                </div>
            `;
          })
          .join("")}
    `;
};


let selectedNoteId = null;

const cardsGrid = document.getElementById("cards-grid");
cardsGrid.addEventListener("click", (event) => {

    const card = event.target.closest(".note-card");
    if(!card) return;

    const id = card.dataset.id;
    const note = notes.find((note) => note.id === id);
    if (!note) return;

    selectedNoteId = note.id;

    document.getElementById("empty-state").style.display = "none";
    noteEditor.style.display = "flex";

    document.getElementById("note-title").value = note.title;
    document.getElementById("note-category").value = note.category;
    document.getElementById("note-content").innerHTML = note.content;
});


function renderCategories() {

    const uniqueCategories = [
        ...new Set(
            notes
                .filter(note => note.username === username)
                .map(note => note.category)
                .filter(category => category)
        )
    ];

    const categoryList = document.getElementById("category-list");
    categoryList.innerHTML = `
        ${uniqueCategories
            .map((cg) => {
                return `<li data-category="${cg}">${cg}</li>`;
            })
            .join("")}
    `;

    const noteCategorySelect = document.getElementById("note-category");
    const dynamicOptions = uniqueCategories
        .map((cg) => {
            return `<option value="${cg}">${cg}</option>`;
        })
        .join("");

    noteCategorySelect.innerHTML = `
        <option value="">No Category</option>
        ${dynamicOptions}
        <option value="__new__">+ Add New Category</option>
    `;
};

const deleteNoteBtn = document.getElementById("delete-note-btn");
deleteNoteBtn.addEventListener("click", () => {
    if(!selectedNoteId) return;
    deleteNote(selectedNoteId);
});


function deleteNote(id) {
    notes = notes.filter((note) => note.id !== id);
    localStorage.setItem("notes", JSON.stringify(notes));

    document.getElementById("empty-state").style.display = "block";
    selectedNoteId = null;  

    noteEditor.style.display = "none";

    renderNotes(currentView);
    renderCategories();
}