fetch('../partials/nav.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById("nav-placeholder").innerHTML = html;

        let logoutBtn = document.getElementById("logout-btn");

        logoutBtn.addEventListener("click", (event) => {
          event.preventDefault();
          sessionStorage.removeItem("currentUser");
          window.location.href = "index.html";
        });
    });



