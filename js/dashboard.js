const username = JSON.parse(currentUser).username; 
const today = new Date().toLocaleDateString("en-CA"); // local date in YYYY-MM-DD format

// Greetings
let greeting;
const hour = new Date().getHours()

if (hour < 12) greeting = "Good morning";
else if (hour < 17) greeting = "Good afternoon";
else greeting = "Good evening";

document.getElementById("greeting-text").textContent = `${greeting}, ${username}`; // textContent so a username with < > can't add html

// day and date
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
 
// Time
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

// City and Weather
function fetchWeather() {
    // some browsers don't have location at all
    if (!navigator.geolocation) {
        showWeatherFallback("Your browser doesn't support location.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            // try/catch because fetch fails when there is no internet or the api is down
            try {
                const { latitude, longitude } = position.coords;

                // Get city
                const locationResponse = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                );

                const locationData = await locationResponse.json();

                const address = locationData.address || {}; // address can be missing for some places
                const city = address.city || address.town || address.village || "";

                document.getElementById("weather-location").textContent = city;


                // Get weather

                // 1) temperature
                const weatherResponse = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
                );

                const weatherData = await weatherResponse.json();

                const temperature = Math.round(weatherData.current.temperature_2m);

                document.getElementById("weather-temp").textContent = `${temperature}°C`;

                // 2) weatherCondition
                const weatherCode = weatherData.current.weather_code;

                let weather;

                if (weatherCode === 0) {
                    weather = "Sunny";
                } else if (weatherCode >= 1 && weatherCode <= 3) {
                    weather = "Cloudy";
                } else if (weatherCode === 45 || weatherCode === 48) {
                    weather = "Foggy";
                } else if (weatherCode >= 51 && weatherCode <= 67) {
                    weather = "Rainy";
                } else if (weatherCode >= 71 && weatherCode <= 77) {
                    weather = "Snowy";
                } else if (weatherCode >= 80 && weatherCode <= 82) {
                    weather = "Rainy";
                } else if (weatherCode === 85 || weatherCode === 86) {
                    weather = "Snowy"; // snow showers
                } else if (weatherCode >= 95) {
                    weather = "Thunderstorm";
                } else {
                    weather = "Unknown";
                }

                document.getElementById("weather-condition").textContent = weather;

                document.getElementById("weather-loaded").hidden = false;
                document.getElementById("weather-fallback").hidden = true;
            } catch (error) {
                showWeatherFallback("Weather unavailable right now. Try again.");
            }
        },
        (error) => {
            // browser asks only once, if it was blocked before it fails right away without asking again
            // so tell the user why it failed, error.code tells the reason
            if (error.code === 1) {
                showWeatherFallback("Location is blocked. Allow it from the icon on the left of the address bar, then try again.");
            } else if (error.code === 2) {
                showWeatherFallback("Can't find your location. Turn on location in your device settings.");
            } else {
                showWeatherFallback("Location took too long. Try again.");
            }
        },
        { timeout: 10000 } // stop waiting after 10 seconds, otherwise it can wait forever
    );
}

// hide the weather and show the "Allow location" button with the reason
function showWeatherFallback(message) {
    document.getElementById("weather-fallback-text").textContent = message;
    document.getElementById("weather-loaded").hidden = true;
    document.getElementById("weather-fallback").hidden = false;
}

fetchWeather();

document.getElementById("weather-retry-btn").addEventListener("click", fetchWeather);


// Pomodoro Timer 
let pomodoroData = localStorage.getItem(`pomodoro_${username}`);
pomodoroData = pomodoroData ? JSON.parse(pomodoroData) : null;

let focusMinutes = 0;
let focusSessions = 0;
if(pomodoroData && pomodoroData.history) { // history can be missing if the data got reset
    if(pomodoroData.history[today]) {
        focusMinutes = pomodoroData.history[today].focusMinutes;
        focusSessions = pomodoroData.history[today].sessionsCompleted;
    }
}

document.getElementById("stat-minutes").textContent = `${focusMinutes}m`;
document.getElementById("stat-sessions").textContent = `${focusSessions} ${focusSessions === 1 ? "session" : "sessions"} completed`; // "1 session", not "1 sessions"


// Tasks
let tasks = localStorage.getItem("tasks");
tasks = tasks ? JSON.parse(tasks) : [];

let userTasks = [];
for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].username === username)   userTasks.push(tasks[i]);
}

let activeUserTasks = userTasks;
activeUserTasks = activeUserTasks.filter(
    (task) => task.completed == false && task.dueDate >= today,
);

activeUserTasks.sort((a, b) => {
    return a.dueDate.localeCompare(b.dueDate);
});

const emptyMessage = document.querySelector(".preview-empty");
const task1El = document.getElementById("task1").closest(".preview-item");
const task2El = document.getElementById("task2").closest(".preview-item");

if (activeUserTasks.length === 0) {
    emptyMessage.hidden = false;
} else {
    emptyMessage.hidden = true;
}

task1El.hidden = activeUserTasks.length < 1;
task2El.hidden = activeUserTasks.length < 2;

if(activeUserTasks.length >= 1) {
    if(activeUserTasks.length >= 2) {
        document.getElementById("task2").textContent = activeUserTasks[1].text;
        document.getElementById("task2date").textContent = activeUserTasks[1].dueDate;
    }
    document.getElementById("task1").textContent = activeUserTasks[0].text;
    document.getElementById("task1date").textContent = activeUserTasks[0].dueDate;
}

document.getElementById("stat-tasks").textContent = activeUserTasks.length;


// Notes
let notes = localStorage.getItem("notes");
notes = notes ? JSON.parse(notes) : [];

let userNotes = [];
for(let i = 0; i < notes.length; i++) {
    if(notes[i].username === username) userNotes.push(notes[i]);
}

userNotes.sort((a, b) => {
    return b.createdAt - a.createdAt;
})

const emptyMessage2 = document.querySelector(".note-preview-empty");

if (userNotes.length === 0) {
    emptyMessage2.hidden = false;
} else {
    emptyMessage2.hidden = true;
    document.getElementById("recent-note-title").textContent = userNotes[0].title;

    // content is saved as html (from the notes editor), so take only its text, otherwise tags like <div> show up
    // DOMParser doesn't run any script or load images, so it is safe
    const noteText = new DOMParser().parseFromString(userNotes[0].content, "text/html").body.textContent;
    document.getElementById("recent-note-body").textContent = noteText;
    document.getElementById("recent-note-category").textContent = userNotes[0].category || "No Category"; // same as notes page
}

document.getElementById("stat-notes").textContent = userNotes.length;