const registerClicked = document.getElementById("show-register");
registerClicked.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("login").classList.add('hidden');
    document.getElementById("register").classList.remove('hidden')
})


const loginClicked = document.getElementById("show-login");
loginClicked.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("register").classList.add('hidden');
    document.getElementById("login").classList.remove('hidden');
})


const loginButton = document.getElementById("login-button");
loginButton.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = "dashboard.html";
})


const registerButton = document.getElementById("register-button");
registerButton.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = "dashboard.html";
})