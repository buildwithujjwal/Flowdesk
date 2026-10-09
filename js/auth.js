// -------------------------------------------------login page------------------------------------------------

// if the user is already logged in, no need to login again, go straight to the dashboard
// same check as auth-gaurd.js, so a broken session still stays on this page
try {
    if (JSON.parse(sessionStorage.getItem("currentUser")).username) {
        window.location.replace("dashboard.html");
    }
} catch (error) {
    // no session or a broken one, so stay here and show the login
}

// ------------------ password hashing (Web Crypto API) ---------------------
// the real password is never saved, only a hash of it.
// same functions are in settings.js, keep both the same or old passwords stop matching.

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

// show the auth forms when "Get Started" is clicked
const getStartedBtn = document.getElementById("get-started-btn");
getStartedBtn.addEventListener("click", () => {
    document.getElementById("landing").classList.add("hidden");
    document.getElementById("auth-wrapper").classList.remove("hidden");
});

// go back to the landing page from the auth forms
const backBtn = document.getElementById("back-to-landing");
backBtn.addEventListener("click", () => {
    document.getElementById("auth-wrapper").classList.add("hidden");
    document.getElementById("landing").classList.remove("hidden");
});

// dark mode toggle button
const darkToggleBtn = document.getElementById("dark-toggle-mode");

// sync icon to whatever theme is already applied
darkToggleBtn.textContent = document.documentElement.dataset.theme === "dark" ? "☀️" : "🌙";

darkToggleBtn.addEventListener("click", () => {
    let isDark = document.documentElement.dataset.theme === "dark";
    let newTheme = isDark ? "light" : "dark";

    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem("theme", newTheme);
    darkToggleBtn.textContent = newTheme === "dark" ? "☀️" : "🌙";
});


//------------------ login / register toggling ---------------------


// checks is the username exists and if do exists check its password and then create a session for user and redirect the user to dashboard.html
const loginButton = document.getElementById("login-button");
loginButton.addEventListener("click", async (event) => { // async because checking the hash takes a moment

    // prevent the button from its default function that is to reload the page
    event.preventDefault();

    
    let username = document.getElementById("login-username").value.trim();
    let password = document.getElementById("login-password").value.trim();

    // fetch the users array from localStorage
    let users = localStorage.getItem("users");
    users = users ? JSON.parse(users) : [];

    // handle all the possible errors
    let error = "";

    // checks for username and its password
    let matchedUser = users.find(user => user.username === username);

    // try/catch so a hashing problem shows a message instead of breaking the page
    try {
      if (!username) {
        error = "username cannot be empty";
      }
      else if (!password) {
        error = "password cannot be empty";
      }
      else if (!matchedUser) {
        error = "username does not exists";
      }
      else if (!canHash()) {
        error = "open the app on https or localhost to log in";
      }
      else if (!(await checkPassword(matchedUser, password))) {
        error = "incorrect password";
      }
      else {
        // old account that still has a plain password, swap it for a hash now
        if (!matchedUser.passwordHash) {
          matchedUser.salt = makeSalt();
          matchedUser.passwordHash = await hashPassword(password, matchedUser.salt);
          delete matchedUser.password;
          localStorage.setItem("users", JSON.stringify(users));
        }

        // created a seesion for the current user
        let userLoggedInAt = Date.now();
        sessionStorage.setItem("currentUser",JSON.stringify({ username, userLoggedInAt }),);

        // redirect to dashboard.html
        window.location.href = "dashboard.html";
      }
    } catch (err) {
      error = "something went wrong, please try again";
    }

    document.getElementById("login-error-msg").innerHTML = error;
        
})

// check if username already exist and save the data to local storage then create the session and redirect user to dashboard.html
const registerButton = document.getElementById("register-button");
registerButton.addEventListener("click", async (event) => { // async because making the hash takes a moment

    // prevent the button from its default function that is reloading the page.
    event.preventDefault();

    let username = document.getElementById("register-username").value.trim();
    let password = document.getElementById("register-password").value.trim();

    
    // fetch the users array from local storage and if its null create a empty array
    let users = localStorage.getItem("users");
    users = users ? JSON.parse(users) : [];

    // handle all the errors 
    let error = "";
    if(!username) error = "username cannot be empty";
    else if(!password) error = "password cannot be empty";

    else if (users.find(user => user.username === username)) error = "username exists!";
    else if (!canHash()) error = "open the app on https or localhost to register";

    if(error == "") {

        // stop a double click from creating the same account twice while the hash is being made
        registerButton.disabled = true;

        try {
            // save only the salt and the hash, never the real password
            const salt = makeSalt();
            const passwordHash = await hashPassword(password, salt);
            users.push({username, salt, passwordHash});

            // save the user's data to local Storage
            localStorage.setItem("users", JSON.stringify(users));

            // create a session for the user
            let userLoggedInAt = Date.now(); // same key name as login, so the session always looks the same
            sessionStorage.setItem("currentUser", JSON.stringify({username, userLoggedInAt}));

            window.location.href = "dashboard.html";
        } catch (err) {
            registerButton.disabled = false; // let the user try again
            document.getElementById("register-error-msg").innerHTML = "something went wrong, please try again";
        }
    }

    else document.getElementById("register-error-msg").innerHTML = error;
})

// triggers when user click on "Don't have an account yet? on login page"
const registerClicked = document.getElementById("show-register");
registerClicked.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("login").classList.add('hidden');
    document.getElementById("register").classList.remove('hidden')
})

// triggers when user click on "Already have an account? on register page"
const loginClicked = document.getElementById("show-login");
loginClicked.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("register").classList.add('hidden');
    document.getElementById("login").classList.remove('hidden');
})