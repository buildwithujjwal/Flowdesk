fetch('../partials/nav.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById("nav-placeholder").innerHTML = html;
    })