let currentUser = sessionStorage.getItem("currentUser");
if (!currentUser) {
  window.location.href = "index.html";
}

// apply saved theme immediately, before anything else renders, to avoid a flash of light mode
let savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
}