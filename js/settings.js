const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".settings-panel");

tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const tab = button.dataset.tab;

        tabButtons.forEach((btn) => {
            btn.classList.remove("is-active");
            btn.setAttribute("aria-selected", "false");
        });

        panels.forEach((panel) => {
            panel.classList.remove("is-active");
        });

        button.classList.add("is-active");
        button.setAttribute("aria-selected", "true");
        document.getElementById(`panel-${tab}`).classList.add("is-active");
    });
});


const users = JSON.parse(localStorage.getItem("users")) || []; // empty array if nothing is saved yet
const username = JSON.parse(currentUser).username;
const index = users.findIndex(user => user.username === username); // -1 if the user isn't found

const saveBtn = document.getElementById("save-btn");

saveBtn.addEventListener("click", (event) => {
    event.preventDefault();

    // trim like login/register do, so stray spaces don't break the match
    const currentPasswd = document.getElementById("current-password").value.trim();
    const newPasswd = document.getElementById("new-password").value.trim();
    const confirmPasswd = document.getElementById("confirm-password").value.trim();

    const error = document.getElementById("password-error");
    error.classList.remove("is-success"); // reset the green from a previous success, so errors show in red again

    if(index === -1) {
        error.textContent = "account not found, please log in again";
    }
    else if(currentPasswd === users[index].password) {
        // preventDefault() skips the "required" check, so check empty manually
        if(newPasswd === "") {
            error.textContent = "new password cannot be empty";
        }
        else if(newPasswd === currentPasswd) {
            error.textContent = "new password must be different from the current one";
        }
        else if(newPasswd === confirmPasswd) {
            users[index].password = newPasswd;

            localStorage.setItem("users", JSON.stringify(users));

            document.getElementById("current-password").value = "";
            document.getElementById("new-password").value = "";
            document.getElementById("confirm-password").value = "";
            error.classList.add("is-success");
            error.textContent = "password changed successfully";
            
        }
        else {
            error.textContent = "newPassword and confirmPassword should be same";
        }
    }
    else {
        error.textContent = "enter correct password";
    }
})

// clear the old message as soon as the user starts typing in any password field
document.getElementById("password-form").addEventListener("input", () => {
    document.getElementById("password-error").textContent = "";
});

// ---------------- Data ----------------

const clearDataBtn = document.getElementById("clear-data-btn");

// Clear current user's data
clearDataBtn.addEventListener("click", () => {

    // ask first, because this can't be undone
    if(!confirm("Delete all your tasks, notes, and timer data? This can't be undone.")) {
        return;
    }

    // read the latest data from localStorage (empty array if nothing is saved yet)
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const notes = JSON.parse(localStorage.getItem("notes")) || [];

    // Remove current user's tasks
    const updatedTasks = tasks.filter(task => task.username !== username);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));

    // Remove current user's notes
    const updatedNotes = notes.filter(note => note.username !== username);
    localStorage.setItem("notes", JSON.stringify(updatedNotes));

    // Remove current user's Pomodoro settings and focus history
    localStorage.removeItem(`pomodoro_${username}`);
    sessionStorage.removeItem(`pomodoro_endTime_${username}`); // timer data is gone, so the running timer's end time should go too

    location.reload();
});