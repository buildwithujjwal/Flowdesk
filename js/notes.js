let notes = localStorage.getItem("notes");
notes = notes ? JSON.parse(notes) : [];

const noteEditor = document.getElementById("note-editor");
const newNote = document.getElementById("new-note-btn");

newNote.addEventListener("click", () => {
    document.getElementById("empty-state").style.display = "none";
    noteEditor.style.display = "flex";
});

