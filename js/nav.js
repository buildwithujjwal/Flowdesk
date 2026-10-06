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


// ---------------------------- Pomodoro alert on other pages ----------------------------

// timer.js only runs on the timer page, so this shows an alert when the running session ends while the user is on any other page.
// everything is inside this function, so these names don't clash with the page's own variables (like username).
// DOMContentLoaded because notes.html loads this file without defer, so the body doesn't exist yet.
document.addEventListener("DOMContentLoaded", () => {

    // timer page has its own overlay (timer.js handles it), and no user means not logged in.
    if (document.getElementById("session-overlay") || !currentUser) return;

    const timerUser = JSON.parse(currentUser).username;
    const endTime = Number(sessionStorage.getItem(`pomodoro_endTime_${timerUser}`)); // saved by timer.js while running

    if (!endTime) return; // timer is not running

    let audioCtx = null;      // created on first click, browsers block sound before the user clicks something
    let alarmInterval = null;
    let notification = null;

    document.addEventListener("click", () => {
        audioCtx = new AudioContext();
    }, { once: true });

    // same beep as the timer page
    const playBeep = () => {
        if (!audioCtx) return;

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
    };

    // go to the timer page, it will count the session and start the next one.
    const openTimer = (event) => {
        event.preventDefault();
        clearInterval(alarmInterval);
        if (notification) notification.close();

        sessionStorage.setItem(`pomodoro_continue_${timerUser}`, "yes"); // tells timer.js to start the next session directly
        window.location.href = "timer.html";
    };

    // runs when the session time is over
    const showTimerAlert = () => {
        let pomodoro = JSON.parse(localStorage.getItem(`pomodoro_${timerUser}`));
        if (!pomodoro || !pomodoro.session.isRunning) return; // timer data was cleared or stopped

        let message = pomodoro.session.mode === "focus" ? "Break time!" : "Back to work!";

        // build the overlay (same look as the timer page)
        let overlay = document.createElement("div");
        overlay.className = "nav-timer-overlay";
        overlay.setAttribute("role", "alertdialog");
        overlay.setAttribute("aria-labelledby", "nav-overlay-message");
        overlay.tabIndex = -1;
        overlay.innerHTML = `
            <p class="nav-overlay-message" id="nav-overlay-message">${message}</p>
            <p class="nav-overlay-hint">Press any key or click to open the timer</p>
        `;
        document.body.appendChild(overlay);
        overlay.focus();

        // beep after every 2 second, like the timer page
        playBeep();
        alarmInterval = setInterval(playBeep, 2000);

        // notification, only if browser supports it and user allowed it
        if ("Notification" in window && Notification.permission === "granted") {
            notification = new Notification("Flowdesk", {
                body: message,
                tag: "pomodoro-session",
                requireInteraction: true,
            });
        }

        overlay.addEventListener("click", openTimer);
        document.addEventListener("keydown", (event) => {
            if (["Alt", "Control", "Meta", "Shift"].includes(event.key)) return; // these keys will not work.
            openTimer(event);
        });
    };

    // wait for the time left, then show the alert (right away if time is already over)
    setTimeout(showTimerAlert, Math.max(endTime - Date.now(), 0));
});


