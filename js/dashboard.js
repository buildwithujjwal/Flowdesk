// ----------------------------------------------------------Dashboard page-----------------------------------------------------------

const username = JSON.parse(currentUser).username; // fetching the username by parsing currentUser from auth-guard.js
const today = new Date().toISOString().split("T")[0]; // getting today's date

document.getElementById("greeting-text").innerHTML = `Good morning, ${username}`;

function updateDay() {
    const now = new Date();

    const day = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric"
    });

    document.getElementById("greeting-date").innerHTML = `${day}`;  

    const tommorrow = new Date(now);
    tommorrow.setDate(now.getDate() + 1);
    tommorrow.setHours(0, 0, 0, 0);

    setTimeout(updateDay, tommorrow - now);
}
updateDay();
 
function updateTime() {
    const now = new Date();

    const time = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });

    document.getElementById("live-clock").innerHTML = `${time}`;
    
    const milSecUntilNextMin = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(updateTime, milSecUntilNextMin);
}
updateTime();


