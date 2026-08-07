fetch('../partials/nav.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById("nav-placeholder").innerHTML = html;

        const logoutBtn = document.getElementById("logout-btn");
        logoutBtn.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = "index.html";
            });
    });

