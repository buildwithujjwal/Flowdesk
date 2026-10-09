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


// ---------------- password hashing (Web Crypto API) ----------------
// same functions as in auth.js, keep both the same or passwords stop matching.

// crypto.subtle only works on https, localhost or a file opened directly, so check before using it
function canHash() {
    return Boolean(window.crypto && window.crypto.subtle);
}

// random text that is saved with each user, so two users with the same password still get different hashes
function makeSalt() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// PBKDF2 runs SHA-256 many times (100000), so guessing passwords one by one is slow
async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
        key,
        256
    );
    // turn the result into hex text so it can be saved in localStorage
    return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// true if the typed password is right. old accounts (saved before hashing) still have a plain "password"
async function checkPassword(user, password) {
    if (user.passwordHash) {
        return (await hashPassword(password, user.salt)) === user.passwordHash;
    }
    return user.password === password;
}

// ---------------- Account ----------------

const users = JSON.parse(localStorage.getItem("users")) || []; // empty array if nothing is saved yet
const username = JSON.parse(currentUser).username;
const index = users.findIndex(user => user.username === username); // -1 if the user isn't found

const saveBtn = document.getElementById("save-btn");

saveBtn.addEventListener("click", async (event) => { // async because checking and making the hash takes a moment
    event.preventDefault();

    // trim like login/register do, so stray spaces don't break the match
    const currentPasswd = document.getElementById("current-password").value.trim();
    const newPasswd = document.getElementById("new-password").value.trim();
    const confirmPasswd = document.getElementById("confirm-password").value.trim();

    const error = document.getElementById("password-error");
    error.classList.remove("is-success"); // reset the green from a previous success, so errors show in red again

    // try/catch so a hashing problem shows a message instead of breaking the page
    try {
        if(index === -1) {
            error.textContent = "account not found, please log in again";
        }
        else if(!canHash()) {
            error.textContent = "open the app on https or localhost to change the password";
        }
        else if(await checkPassword(users[index], currentPasswd)) {
            // preventDefault() skips the "required" check, so check empty manually
            if(newPasswd === "") {
                error.textContent = "new password cannot be empty";
            }
            else if(newPasswd === currentPasswd) {
                error.textContent = "new password must be different from the current one";
            }
            else if(newPasswd === confirmPasswd) {
                // save a new salt and hash, and remove the old plain password if this account still had one
                const salt = makeSalt();
                users[index].passwordHash = await hashPassword(newPasswd, salt);
                users[index].salt = salt;
                delete users[index].password;

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
    } catch (err) {
        error.textContent = "something went wrong, please try again";
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