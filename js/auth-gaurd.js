let currentUser = sessionStorage.getItem("currentUser");
if (!currentUser) {
  window.location.href = "index.html";
}