// -------------------Pomodoro Timer------------------

const username = JSON.parse(currentUser).username;
const today = new Date().toISOString().split("T")[0];
const storageKey = `pomodoro_${username}`;

let pomodoro = localStorage.getItem(storageKey);
pomodoro = pomodoro ? JSON.parse(pomodoro) : null;

if(!pomodoro) {
    pomodoro = {
        settings: {focusDuration: 25, shortDuration: 5, longDuration: 15, roundsPerCycle: 4 },
        session: { mode: "focus", remainingSeconds: 25 * 60, isRunning: false, currentRound: 1 },
        history: {},
    };
}

if(!pomodoro.history[today]) {
    pomodoro.history[today] = {sessionsCompleted: 0, focusMinutes: 0 };
}

const timerDisplay = document.getElementById("timer-display");
const cycleLabel = document.getElementById("cycle-label");
const modeLabel = document.getElementById("mode-label");
const ringProgress = document.getElementById("ring-progress");
const cycleDots = document.getElementById("cycle-dots");
const startPauseBtn = document.getElementById("start-pause-btn");
const modeButtons = document.querySelectorAll(".mode-btn");

savePomodoro();
renderTimer();
renderHistory();

function savePomodoro() {
    localStorage.setItem(storageKey, JSON.stringify(pomodoro));
}

function renderTimer() {

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


    cycleLabel.textContent = `Round ${pomodoro.session.currentRound} of ${pomodoro.settings.roundsPerCycle}`;


    if (pomodoro.session.isRunning) startPauseBtn.textContent = "Pause";
    else startPauseBtn.textContent = "Start";


    let totalSeconds;
    if(pomodoro.session.mode === "focus") totalSeconds = pomodoro.settings.focusDuration * 60;
    else if (pomodoro.session.mode == "short") totalSeconds = pomodoro.settings.shortDuration * 60;
    else totalSeconds = pomodoro.settings.longDuration * 60;

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