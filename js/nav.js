fetch('../partials/nav.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById("nav-placeholder").innerHTML = html;

        // logout logic
        let logoutBtn = document.getElementById("logout-btn");
        logoutBtn.addEventListener("click", (event) => {
          event.preventDefault();
          sessionStorage.removeItem("currentUser");
          window.location.href = "index.html";
        });

        // dark mode toggle
        let darkToggleBtn = document.getElementById("dark-toggle-mode");

        // sync icon to whatever theme is already applied
        darkToggleBtn.textContent = document.documentElement.dataset.theme === "dark" ? "☀️" : "🌙";

        darkToggleBtn.addEventListener("click", () => {
            let isDark = document.documentElement.dataset.theme === "dark";
            let newTheme = isDark ? "light" : "dark";

            document.documentElement.dataset.theme = newTheme;
            localStorage.setItem("theme", newTheme);
            darkToggleBtn.textContent = newTheme === "dark" ? "☀️" : "🌙";
        });
    });



