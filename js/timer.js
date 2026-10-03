// ----------------------------------------------------------Pomodoro Timer-----------------------------------------------------------



// ------------------------------------ State -----------------------------------------

const username = JSON.parse(currentUser).username; // fetching the username by parsing currentUser from auth-guard.js

const today = new Date().toISOString().split("T")[0]; // getting today's date
const storageKey = `pomodoro_${username}`; // naming key that will be stored in the localStorage different by username.

// getting the user's timer details if exist in localStorage.
let pomodoro = localStorage.getItem(storageKey);
pomodoro = pomodoro ? JSON.parse(pomodoro) : null;

// if user's timer does'nt exist in localStorage, manually created one with default values.
if(!pomodoro) {
    pomodoro = {
        settings: {focusDuration: 0, shortDuration: 0, longDuration: 0, roundsPerCycle: 1},
        session: { mode: "focus", remainingSeconds: 0, isRunning: false, currentRound: 1 },
        history: {},
    };
}

// if history does'nt have today's date, so it will add today's object.
if(!pomodoro.history[today]) {
    pomodoro.history[today] = {sessionsCompleted: 0, focusMinutes: 0 };
}


// ----------------------------------- DOM references --------------------------------------

// Left Sidebar
const modeButtons = document.querySelectorAll(".mode-btn"); // mode navbar
const statSessions = document.getElementById("stat-sessions"); // stats sessions
const statMinutes = document.getElementById("stat-minutes"); // stats minutes
const fields = document.querySelectorAll(".duration-field input"); // settings
const historyList = document.getElementById("history-list"); // history list

// Right main : Timer face & controls
const timerDisplay = document.getElementById("timer-display"); // (00:12 OR 25:00 OR 04:24)
const cycleLabel = document.getElementById("cycle-label"); // (Round 1 of 4 OR Round 2 of 3)
const modeLabel = document.getElementById("mode-label"); // (focus session OR short break OR long break)
const ringProgress = document.getElementById("ring-progress");
const cycleDots = document.getElementById("cycle-dots");
const startPauseBtn = document.getElementById("start-pause-btn");
const resetBtn = document.getElementById("reset-btn");
const skipBtn = document.getElementById("skip-btn");

// Wraps both sides
const timerLayout = document.querySelector(".timer-layout");

// for Overlay
const sessionOverlay = document.getElementById("session-overlay");
const overlayMessage = document.getElementById("overlay-message");

// Worker Thread 
const timerWorker = new Worker("../js/timer-worker.js"); // Creating a new worker thread.

// Audio Setup
const audioCtx = new AudioContext();
let alarmInterval = null;
let activeNotification = null;


// ------------------------------------ Helper functions ----------------------------------

// Return the timer's current mode duration in seconds (focus session, short break, long break);
function getCurrentModeDuration() {
    if (pomodoro.session.mode === "focus") return pomodoro.settings.focusDuration * 60;
    else if (pomodoro.session.mode === "short") return pomodoro.settings.shortDuration * 60;
    else return pomodoro.settings.longDuration * 60;
}

// It will Shift onto the next mode
function advanceSession() {

    // advances session from focus to break (short break OR long break)
    if (pomodoro.session.mode === "focus") {

        pomodoro.session.currentRound++;

        if (pomodoro.session.currentRound > pomodoro.settings.roundsPerCycle) {
            pomodoro.session.mode = "long";
        }

        else {
            pomodoro.session.mode = "short";
        }
    }

    // advances session from break to focus
    else if (pomodoro.session.mode === "short") {
        pomodoro.session.mode = "focus";
    }

    // advances session from break to focus and start the new cycle with round 1.
    else {
        pomodoro.session.mode = "focus";
        pomodoro.session.currentRound = 1;
    }

    pomodoro.session.remainingSeconds = getCurrentModeDuration(); // storing the next mode duration in remaining seconds.
}


// ---------------- Save Function --------------------
function savePomodoro() {
    localStorage.setItem(storageKey, JSON.stringify(pomodoro)); // saving pomodoro timer details in the storage key of user.
}


// ------------------------------------- Render functions --------------------------------------

// Render the Timer, its details and mode and stat navbar.
function renderTimer() {

    // mode changes in the mode navbar based on the session in the storage.
    timerLayout.dataset.mode = pomodoro.session.mode;

    // making current mode active so that it will appear on the timer.
    modeButtons.forEach((btn) => {
        if (btn.dataset.mode === pomodoro.session.mode)  btn.classList.add("is-active");
        else btn.classList.remove("is-active");
    })

    // Render the mode label (Focus session OR Short break OR Long break)
    if(pomodoro.session.mode == "focus") modeLabel.textContent = "Focus session";
    else if (pomodoro.session.mode === "short") modeLabel.textContent = "Short break";
    else modeLabel.textContent = "Long Break";

    let mins = Math.floor(pomodoro.session.remainingSeconds / 60); // Calculating minutes from the remaining time.
    let secs = pomodoro.session.remainingSeconds % 60; // Calculating seconds from the remaining time.

    // if mins or secs are in single digit, adding a prefix 0.
    mins = mins < 10 ? "0" + mins : mins;
    secs = secs < 10 ? "0" + secs : secs;

    // Rendering the minutes and seconds calculated above.
    timerDisplay.textContent = `${mins}:${secs}`;

    // Rendering a small text or Round Info on the timer.
    if(pomodoro.session.mode === "short") {
        cycleLabel.textContent = "you earned it";
    }
    else if(pomodoro.session.mode === "long") {
        cycleLabel.textContent = "time for a nap";
    }
    else cycleLabel.textContent = `Round ${pomodoro.session.currentRound} of ${pomodoro.settings.roundsPerCycle}`;

    // Rendering the startPauseBtn on basis of running state.
    if (pomodoro.session.isRunning) startPauseBtn.textContent = "Pause";
    else startPauseBtn.textContent = "Start";

    // Getting total seconds of the current mode.
    let totalSeconds = getCurrentModeDuration();

    // calculate what fraction of time is left, then convert it to stroke-dashoffset so the ring visually drains as remainingSeconds counts down to 0
    let fraction = pomodoro.session.remainingSeconds / totalSeconds;
    let circumference = 628;
    ringProgress.style.strokeDashoffset = circumference * (1 - fraction);

    // Render dots for total rounds in the cycle; fill dots up to and including the current round
    cycleDots.innerHTML = "";
    for (let i = 1; i <= pomodoro.settings.roundsPerCycle; i++) {
        if(i <= pomodoro.session.currentRound) {
            cycleDots.innerHTML += `<span class="dot is-filled"></span>`;
        }
        else {
            cycleDots.innerHTML += `<span class="dot"></span>`;
        }
    }

    // update the Today's stats in the stats navbar.
    statSessions.textContent = pomodoro.history[today].sessionsCompleted;
    statMinutes.textContent = `${pomodoro.history[today].focusMinutes}m`;
}

// Render the history stats of the user.
function renderHistory() {

    // sort the hostory array on the basis of date backward.
    let dates = Object.keys(pomodoro.history).sort((a, b) => b.localeCompare(a));

    // build and render the html for every stat in the history array.
    historyList.innerHTML = `
        ${dates
          .map((date) => {
            const entry = pomodoro.history[date];
            return `
                <li class="history-item">
                    <div class="history-info">
                        <div>
                            <h3>${date}</h3>
                            <p>${entry.sessionsCompleted} sessions · ${entry.focusMinutes}m focus</p>
                        </div>
                    </div>
                </li>
            `;
          })
          .join("")}
    `;
}


// ---------------------------------------- Web Worker -------------------------------------

// Recieve the message send by the worker thread (After every 1 sec)
timerWorker.onmessage = function (event) {   // event is object of {type, remaining};

    // tick means Remaining time is not 0.
    if (event.data.type === "tick") {
        pomodoro.session.remainingSeconds = event.data.remaining;
        renderTimer();
    }

    // done means Remaining time is 0.
    if (event.data.type === "done") {
        
        let wasFocus = pomodoro.session.mode === "focus"; // weather currentSession was focus sessionor not.

        // if currentSession was focus session, increase the today's stats in histoy.
        if(wasFocus) {
            pomodoro.history[today].sessionsCompleted++;
            pomodoro.history[today].focusMinutes += pomodoro.settings.focusDuration;
        }

        // advances the session to next and stop running for now.
        advanceSession();
        pomodoro.session.isRunning = false;

        // save each detail and render the page.
        savePomodoro();
        renderTimer();
        renderHistory();

        // show the message in between the sessions overlay.
        let message = wasFocus ? "Break time!" : "Back to work!";
        showSessionOverlay(message);
    }
};


// --------------------------- Notification/overlay/sound functions ---------------------------------

// return a notification object only if permission is granted by the user.
function showPersistentNotification(message) {
    if (Notification.permission === "granted") {
        activeNotification = new Notification("Flowdesk", {
            body: message,                   // notification message.
            tag: "pomodoro-session",         // one notification per tag, if another made previous dismissed.
            requireInteraction: true,        // do not auto-dismiss notification after a few seconds.
        });
    }
}

// blur the screen at each advancement and show notification
function showSessionOverlay(message) {
    overlayMessage.textContent = message;           // shows the message on the overlay screen
    sessionOverlay.classList.add("is-visible");     // make display to flex of overlay

    // play the alarm beep after every 2 second.
    playAlarmSound(); 
    alarmInterval = setInterval(() => {
        playAlarmSound();
    }, 2000);

    showPersistentNotification(message);          // shows persistent notification on the notification corner. 
}

// make screen clear
function hideSessionOverlay() {

    sessionOverlay.classList.remove("is-visible");   // make display to none of overlay

    // stops and delete the alarmInterval.
    clearInterval(alarmInterval); 
    alarmInterval = null;

    // close and delete the notification.
    if (activeNotification) {
        activeNotification.close();
        activeNotification = null;
    }

    // make the next session running.
    pomodoro.session.isRunning = true;
    timerWorker.postMessage({ type: "start", seconds: pomodoro.session.remainingSeconds });

    savePomodoro();
    renderTimer();
}

// play beep sound at the time of blur screen
function playAlarmSound() {
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);             
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    oscillator.frequency.value = 880;
    oscillator.type = "sine";

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
}


// ---------------------------------- Event listeners --------------------------------

// handle the start pause button if clicked.
startPauseBtn.addEventListener("click", () => {

    // session is active, send the worker thread "stop" and stops running.
    if (pomodoro.session.isRunning) {
        timerWorker.postMessage({ type: "stop" });
        pomodoro.session.isRunning = false;
    }

    else {
        if (Notification.permission === "granted") {
            Notification.requestPermission();       // send notification if permission granted.
        }

        // send the worker thread "start" and starts running.
        timerWorker.postMessage({ type: "start", seconds: pomodoro.session.remainingSeconds });
        pomodoro.session.isRunning = true;
    }

    // save and render.
    savePomodoro();
    renderTimer();
});

// handle the reset button if clicked.
resetBtn.addEventListener("click", () => {

    timerWorker.postMessage({ type: "stop" }); // tell the worker thread to stop.

    // stops the session and update the remaining seconds with total seconds.
    pomodoro.session.isRunning = false;
    pomodoro.session.remainingSeconds = getCurrentModeDuration();

    // save and render.
    savePomodoro();
    renderTimer();
})

// handle the skip button if clicked.
skipBtn.addEventListener("click", () => {

    timerWorker.postMessage({ type: "stop" }); // tell the worker thread to stop.

    // advances to next session and tell the worker to start with remaining seconds.
    advanceSession();
    pomodoro.session.isRunning = true;
    timerWorker.postMessage({ type: "start", seconds: pomodoro.session.remainingSeconds });

    // save and render.
    savePomodoro();
    renderTimer();
})

// handle the mode buttons in mode navbar if clicked.
modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        
        timerWorker.postMessage({ type: "stop" });  // tell the worker thread to stop.

        // change the session details as per the selected mode.
        pomodoro.session.mode = btn.dataset.mode;
        pomodoro.session.remainingSeconds = getCurrentModeDuration();
        pomodoro.session.isRunning = false;

        // svae and render.
        savePomodoro();
        renderTimer();
    })
})

// get and set the field value in storage if value is valid.
fields.forEach((field) => {
    field.addEventListener("input", () => {
        let fieldId = field.id;
        let value = Number(field.value);

        if (field.value === "" || isNaN(value) || value <= 0) return;   // for bad input cases, return;

        pomodoro.settings[fieldId] = value;  // setting the value in storage

        // if current field is current mode, then also set the reaminingSeconds in storage.
        if(fieldId === pomodoro.session.mode + "Duration") {
            pomodoro.session.remainingSeconds = Number(field.value) * 60;
        }
 
        // save and render.
        savePomodoro();
        renderTimer();
    })
})

// clear the overlaying div by pressing any key except some.
document.addEventListener("keydown", (event) => {    
    if (["Alt", "Control", "Meta", "Shift"].includes(event.key)) return;  // these keys will not work.
    if (!document.hasFocus()) return; // work only if page is open.

    // make the display to none of overlay div
    if (sessionOverlay.classList.contains("is-visible")) {
        hideSessionOverlay();
    }
});


// ------------------ Initial render calls ----------------------

savePomodoro();
renderTimer();
renderHistory();


// ------------------------------------------------ end ----------------------------------------------------------