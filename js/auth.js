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

// checks is the username exists and if do exists check its password and then create a session for user and redirect the user to dashboard.html
const loginButton = document.getElementById("login-button");
loginButton.addEventListener("click", (event) => {

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

    if (!matchedUser) {
      error = "username does not exists";
    } 
    else if (matchedUser.password !== password) {
      error = "incorrect password";
    } 
    else {
      // created a seesion for the current user
      let userLoggedInAt = Date.now();
      sessionStorage.setItem("currentUser",JSON.stringify({ username, userLoggedInAt }),);

      // redirect to dashboard.html
      window.location.href = "dashboard.html";
    }

    document.getElementById("login-error-msg").innerHTML = error;
        
})

// check if username already exist and save the data to local storage then create the session and redirect user to dashboard.html
const registerButton = document.getElementById("register-button");
registerButton.addEventListener("click", (event) => {

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

    else if (!users.find(user => user.username === username)) {
        users.push({username, password});
    }

    else error = "username exists!";

    if(error == "") {

        // save the user's data to local Storage
        localStorage.setItem("users", JSON.stringify(users));

        // create a session for the user
        let loggedinAt = Date.now();
        sessionStorage.setItem("currentUser", JSON.stringify({username, loggedinAt}));

        window.location.href = "dashboard.html";
    }

    else document.getElementById("register-error-msg").innerHTML = error;
})

