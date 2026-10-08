let currentUser = sessionStorage.getItem("currentUser");

// check the session is real JSON with a username, a missing or broken value counts as logged out
let isLoggedIn = false;
try {
  isLoggedIn = Boolean(JSON.parse(currentUser).username);
} catch (error) {
  isLoggedIn = false;
}

if (!isLoggedIn) {
  // replace() instead of href, so the back button doesn't come back to this protected page
  window.location.replace("index.html");
}

// apply saved theme immediately, before anything else renders, to avoid a flash of light mode
let savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
}
