// -------------------Pomodoro Timer------------------

const username = JSON.parse(currentUser).username;
const today = new Date().toISOString().split("T")[0];
const storageKey = `pomodoro_${username}`;

const timerDisplay = document.getElementById("timer-display");
const cycleLabel = document.getElementById("cycle-label");
const modeLabel = document.getElementById("mode-label");
const ringProgress = document.getElementById("ring-progress");
const cycleDots = document.getElementById("cycle-dots");
const startPauseBtn = document.getElementById("start-pause-btn");
const modeButtons = document.querySelectorAll(".mode-btn");
const timerLayout = document.querySelector(".timer-layout");

const statSessions = document.getElementById("stat-sessions");
const statMinutes = document.getElementById("stat-minutes");

const audioCtx = new AudioContext();
const timerWorker = new Worker("../js/timer-worker.js");

const resetBtn = document.getElementById("reset-btn");
const skipBtn = document.getElementById("skip-btn");

const sessionOverlay = document.getElementById("session-overlay");
const overlayMessage = document.getElementById("overlay-message");

let alarmInterval = null;
let activeNotification = null;

let pomodoro = localStorage.getItem(storageKey);
pomodoro = pomodoro ? JSON.parse(pomodoro) : null;

if(!pomodoro) {
    pomodoro = {
        settings: {focusDuration: 0.3, shortDuration: 0.1, longDuration: 0.2, roundsPerCycle: 4},
        session: { mode: "focus", remainingSeconds: 0.3 * 60, isRunning: false, currentRound: 1 },
        history: {},
    };
}

if(!pomodoro.history[today]) {
    pomodoro.history[today] = {sessionsCompleted: 0, focusMinutes: 0 };
}

statSessions.textContent = pomodoro.history[today].sessionsCompleted;
statMinutes.textContent = `${pomodoro.history[today].focusMinutes}m`;

timerWorker.onmessage = function (event) {
    if (event.data.type === "tick") {
        pomodoro.session.remainingSeconds = event.data.remaining;
        renderTimer();
    }

    if (event.data.type === "done") {
        
        let wasFocus = pomodoro.session.mode === "focus";

        if(wasFocus) {
            pomodoro.history[today].sessionsCompleted++;
            pomodoro.history[today].focusMinutes += pomodoro.settings.focusDuration;
        }

        advanceSession();
        pomodoro.session.isRunning = false;

        savePomodoro();
        renderTimer();
        renderHistory();

        let message = wasFocus ? "Break time!" : "Back to work!";
        showSessionOverlay(message);
    }
};

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

function showSessionNotification(wasFocus) {};

startPauseBtn.addEventListener("click", () => {

    if (pomodoro.session.isRunning) {
        timerWorker.postMessage({ type: "stop" });
        pomodoro.session.isRunning = false;
    }

    else {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
        timerWorker.postMessage({ type: "start", seconds: pomodoro.session.remainingSeconds });
        pomodoro.session.isRunning = true;
    }

    savePomodoro();
    renderTimer();
});


resetBtn.addEventListener("click", () => {

    timerWorker.postMessage({ type: "stop" });

    pomodoro.session.isRunning = false;
    pomodoro.session.remainingSeconds = getCurrentModeDuration();

    savePomodoro();
    renderTimer();
})

skipBtn.addEventListener("click", () => {

    timerWorker.postMessage({ type: "stop" });

    advanceSession();
    pomodoro.session.isRunning = true;
    timerWorker.postMessage({ type: "start", seconds: pomodoro.session.remainingSeconds });

    savePomodoro();
    renderTimer();
})


modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        
        timerWorker.postMessage({ type: "stop" });

        pomodoro.session.mode = btn.dataset.mode;
        pomodoro.session.remainingSeconds = getCurrentModeDuration();
        pomodoro.session.isRunning = false;

        savePomodoro();
        renderTimer();
    })
})


function advanceSession() {

    if (pomodoro.session.mode === "focus") {

        pomodoro.session.currentRound++;

        if (pomodoro.session.currentRound > pomodoro.settings.roundsPerCycle) {
            pomodoro.session.mode = "long";
        }

        else {
            pomodoro.session.mode = "short";
        }
    }

    else if (pomodoro.session.mode === "short") {
        pomodoro.session.mode = "focus";
    }

    else {
        pomodoro.session.mode = "focus";
        pomodoro.session.currentRound = 1;
    }

    pomodoro.session.remainingSeconds = getCurrentModeDuration();
}

function showSessionOverlay(message) {

    overlayMessage.textContent = message;
    sessionOverlay.classList.add("is-visible");

    playAlarmSound();

    alarmInterval = setInterval(() => {
        playAlarmSound();
    }, 2000);

    if (Notification.permission === "granted") {
        activeNotification = new Notification("Flowdesk", {
            body: message,
            tag: "pomodoro-session",
            requireInteraction: true,
        });
    }
}

function hideSessionOverlay() {

    sessionOverlay.classList.remove("is-visible");

    clearInterval(alarmInterval);
    alarmInterval = null;

    if (activeNotification) {
        activeNotification.close();
        activeNotification = null;
    }

    pomodoro.session.isRunning = true;
    timerWorker.postMessage({ type: "start", seconds: pomodoro.session.remainingSeconds });

    savePomodoro();
    renderTimer();
}

document.addEventListener("keydown", () => {    
    if (["Alt", "Control", "Meta", "Shift"].includes(event.key)) return;
    if (!document.hasFocus()) return;

    if (sessionOverlay.classList.contains("is-visible")) {
        hideSessionOverlay();
    }
});


savePomodoro();
renderTimer();
renderHistory();

function getCurrentModeDuration() {
    if (pomodoro.session.mode === "focus") return pomodoro.settings.focusDuration * 60;
    else if (pomodoro.session.mode === "short") return pomodoro.settings.shortDuration * 60;
    else return pomodoro.settings.longDuration * 60;
}

function savePomodoro() {
    localStorage.setItem(storageKey, JSON.stringify(pomodoro));
}

function renderTimer() {

    timerLayout.dataset.mode = pomodoro.session.mode;

    modeButtons.forEach((btn) => {
        if (btn.dataset.mode === pomodoro.session.mode)  btn.classList.add("is-active");
        else btn.classList.remove("is-active");
    })

    if(pomodoro.session.mode == "focus") modeLabel.textContent = "Focus session";
    else if (pomodoro.session.mode === "short") modeLabel.textContent = "Short break";
    else modeLabel.textContent = "Long Break";


    let mins = Math.floor(pomodoro.session.remainingSeconds / 60);
    let secs = pomodoro.session.remainingSeconds % 60;

    mins = mins < 10 ? "0" + mins : mins;
    secs = secs < 10 ? "0" + secs : secs;

    timerDisplay.textContent = `${mins}:${secs}`;

    if(pomodoro.session.mode === "short") {
        cycleLabel.textContent = "you earned it";
    }
    else if(pomodoro.session.mode === "long") {
        cycleLabel.textContent = "time for a nap";
    }
    else cycleLabel.textContent = `Round ${pomodoro.session.currentRound} of ${pomodoro.settings.roundsPerCycle}`;


    if (pomodoro.session.isRunning) startPauseBtn.textContent = "Pause";
    else startPauseBtn.textContent = "Start";


    let totalSeconds = getCurrentModeDuration();

    let fraction = pomodoro.session.remainingSeconds / totalSeconds;
    let circumference = 628;

    ringProgress.style.strokeDashoffset = circumference * (1 - fraction);


    cycleDots.innerHTML = "";
    for (let i = 1; i <= pomodoro.settings.roundsPerCycle; i++) {
        if(i <= pomodoro.session.currentRound) {
            cycleDots.innerHTML += `<span class="dot is-filled"></span>`;
        }
        else {
            cycleDots.innerHTML += `<span class="dot"></span>`;
        }
    }
}

function renderHistory() {

    let historyList = document.getElementById("history-list");

    let dates = Object.keys(pomodoro.history).sort((a, b) => b.localeCompare(a));

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

const fields = document.querySelectorAll(".duration-field input");

fields.forEach((field) => {
    field.addEventListener("input", () => {
        let fieldId = field.id;
        let value = Number(field.value);

        if (field.value === "" || isNaN(value) || value <= 0) return;

        pomodoro.settings[fieldId] = value;

        if(fieldId === pomodoro.session.mode + "Duration") {
            pomodoro.session.remainingSeconds = Number(field.value) * 60;
        }

        savePomodoro();
        renderTimer();
    })
})