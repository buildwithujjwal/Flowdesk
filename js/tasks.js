// ---------------------------------------------TASKS.HTML--------------------------------------------------------


let tasks = localStorage.getItem("tasks"); // fetched the tasks array from the local storage
tasks = tasks ? JSON.parse(tasks) : []; // if it is null, provide an empty array.

const username = JSON.parse(currentUser).username; // currentUser already been fetched in auth-guard.js.

let today = new Date().toLocaleDateString("en-CA"); // let, because it is updated if the page stays open past midnight. converting the todays local date into YYYY-MM-DD format (en-CA gives this format)

let currentView = "latestFive"; //default rendering to latest 5 added tasks
let searchText = ""; // whatever is typed in the search box, used by renderTasks (declared before renderTasks runs)
let editingTaskId = null; // id of the task being edited, null means the form adds a new task
renderTasks(currentView);
sendReminders(); // remind about the tasks due today when the page opens


// -------------------------Add Task--------------------------
let addTask = document.getElementById("task-form");
addTask.addEventListener("submit", (event) => {
  event.preventDefault(); // prevent the reloading of page

  // generate and provide all the keys that are going to save in tasks array to be used later.
  const id = crypto.randomUUID();
  let completed = false;
  const createdAt = Date.now();
  let reminderSent = false;

  // fetched the text and the dueDate, the user filled.
  let text = document.getElementById("task-input").value.trim();
  let dueDate = document.getElementById("dueDate").value;

  // handle all the possible errors.
  let error = "";
  if (!text) error = "task cannot be empty";
  else if (!dueDate) error = "Select the Date";
  else if (dueDate < today) error = "Invalid Date";
  // currentUser is a string, so use username here. capital or small letters don't matter, and the task being edited doesn't count.
  else if (
    tasks.find(
      (task) => task.username === username && task.text.toLowerCase() === text.toLowerCase() && task.id !== editingTaskId,
    )
  )
    error = "task already exists";
  else if (editingTaskId) {
    // editing an old task, just change its text and date
    const task = tasks.find((task) => task.id === editingTaskId);
    if (task) { // it could be deleted in another tab
      if (task.dueDate !== dueDate) task.reminderSent = false; // new date, so remind again on that day
      task.text = text;
      task.dueDate = dueDate;
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    stopEditing(); // back to the add mode
    renderTasks(currentView); // stay on the same view
  }
  else {
    // push the object into the array.
    tasks.push({
      username,
      id,
      text,
      completed,
      createdAt,
      dueDate,
      reminderSent,
    });

    // pushing the array back into the local storage.
    localStorage.setItem("tasks", JSON.stringify(tasks));

    renderTasks("latestFive"); // rendering the lastest five added tasks.

    // reseting the fields that user just filled and submitted.
    document.getElementById("task-input").value = "";
    document.getElementById("dueDate").value = "";
  }

  // printing error if any.
  document.getElementById("error").innerHTML = error;
});

// ------------------------RenderTask-------------------------
function renderTasks(str) {

  currentView = str;
  let taskList = document.getElementById("task-list");

  // making a User's specific task list "userTasks" because localStorage contains all user's tasks together.
  let userTasks = [];
  for (let i = 0; i < tasks.length; i++) {
    
    if (tasks[i].username === username)   userTasks.push(tasks[i]);
  }

  // keep only the tasks whose text has the searched text
  if (searchText) {
    userTasks = userTasks.filter((task) => task.text.toLowerCase().includes(searchText));
  }

  // highlight the clicked filter button (latestFive has no button, so nothing is highlighted)
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === str);
  });

  // button "all" clicked
  if (str == "all") {

    // render non completed, non missed first and then missed and then completed.
    userTasks.sort((a, b) => {
      const aCompleted = a.completed;
      const bCompleted = b.completed;
      const aMissed = !a.completed && a.dueDate < today;
      const bMissed = !b.completed && b.dueDate < today;

      if (!aCompleted && bCompleted) return -1; // a is not completed push up
      if (aCompleted && !bCompleted) return 1; // b is not completed push up

      if (!aMissed && bMissed) return -1; // a is not missed push up
      if (aMissed && !bMissed) return 1; // b is not missed push up

      return a.dueDate.localeCompare(b.dueDate); // nearest dueDate first
    });
  }
  
  // default rendering of 5 latest add tasks
  else if (str === "latestFive") {
    userTasks.sort((a, b) => {
      return b.createdAt - a.createdAt; // latest created first
    });
    userTasks = userTasks.slice(0, 5); // slice it to top 5
  } 
  
  // button "active" clicked
  else if (str === "active") {
    userTasks = userTasks.filter(
      (task) => task.completed == false && task.dueDate >= today, //not completed and not missed tasks
    );

    userTasks.sort((a, b) => {
      return a.dueDate.localeCompare(b.dueDate); // nearest deadline first
    });
  } 
  
  // button "completed" clicked
  else if (str == "completed") {
    userTasks = userTasks.filter((task) => task.completed == true); // completed tasks

    userTasks.sort((a, b) => {
      return b.createdAt - a.createdAt; // latest added first
    });
  } 
  
  // button "today" clicked
  else if (str == "today") {
    userTasks = userTasks.filter((task) => task.dueDate == today); // tasks with dueDate today

    userTasks.sort((a, b) => {
      return b.createdAt - a.createdAt; //latest added first
    });
  } 
  
  else if (str === "missed") {
    userTasks = userTasks.filter(
      (task) => task.dueDate < today && task.completed == false, // not completed and dueDate missed tasks
    );

    userTasks.sort((a, b) => {
      return a.dueDate.localeCompare(b.dueDate); // oldest deadline first
    });
  }

  // nothing to show, tell the user instead of leaving it blank
  if (userTasks.length === 0) {
    taskList.innerHTML = `<li class="no-tasks">No tasks found</li>`;
    return;
  }

  // Used Template Literals to make tasks list
  // text goes through escapeHTML so it shows as plain text, not as html
  taskList.innerHTML = `
        ${userTasks
          .map((task) => {
            return `
                <li class="task-item ${task.completed ? "completed" : ""}" data-id = "${task.id}">
                    <div class="task-info">
                        <input type="checkbox" ${task.completed ? "checked" : ""} onchange="checkbox('${task.id}')">
                        <div>
                            <h3>${escapeHTML(task.text)}</h3>
                            <p>${task.dueDate}</p>
                        </div>
                    </div>

                    <div class="task-actions">
                        <button type="button"
                        onclick="editTask('${task.id}')">Edit</button>
                        <button type="button"
                        onclick="deleteTask('${task.id}')">Delete</button>
                    </div>
                </li>
            `;
          })
          .join("")}
    `;
}

// turns < > & " ' into safe text, so a task can't add its own html (or code) to the page
function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Delete task
function deleteTask(id) {
  if (!confirm("Delete this task? This can't be undone.")) return; // ask first, so one wrong click doesn't wipe a task
  if (id === editingTaskId) stopEditing(); // the task in the form is gone, so go back to add mode

  tasks = tasks.filter((task) => task.id !== id);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(currentView);
}

// Edit task
function editTask(id) {
  const task = tasks.find((task) => task.id === id);
  if (!task) return; // if no such task exist, stop here

  editingTaskId = id;

  // fill the form with the task's data and show it
  document.getElementById("task-input").value = task.text;
  document.getElementById("dueDate").value = task.dueDate;
  document.getElementById("error").textContent = "";
  taskForm.querySelector('button[type="submit"]').textContent = "Save Task";
  taskForm.style.display = "flex";
  document.getElementById("task-input").focus();
}

// reset the form back to adding a new task
function stopEditing() {
  editingTaskId = null;
  document.getElementById("task-input").value = "";
  document.getElementById("dueDate").value = "";
  taskForm.querySelector('button[type="submit"]').textContent = "Add Task";
}

// CheckBox
function checkbox(id) {
  const task = tasks.find((task) => task.id === id);
  if (!task) return; // it could be deleted in another tab
  if (task.completed == true) task.completed = false;
  else task.completed = true;

  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(currentView);
}


// button "New Task" clicked
const newTaskBtn = document.getElementById("new-task-btn");
const taskForm = document.getElementById("task-form");

newTaskBtn.addEventListener("click", () => {
  stopEditing(); // if a task was being edited, start fresh
  taskForm.style.display = "flex";

  // ask for notification permission here, browsers only allow asking after a click
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then(sendReminders); // if allowed, remind right away instead of waiting for a reload
  }
});


// Any filter button clicked
const filterButtons = document.querySelectorAll("[data-filter]"); // All elements that have a data-filter attribute

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    renderTasks(button.dataset.filter); // Access to all data attributes of an element
    taskForm.style.display = "none"; // make the add task form's display none.
    stopEditing(); // form is hidden, so cancel any edit
  });
});


// clear error when user types
document.getElementById("task-input").addEventListener("input", () => {
    document.getElementById("error").textContent = "";
});

// clear error when user picks a date
document.getElementById("dueDate").addEventListener("change", () => {
    document.getElementById("error").textContent = "";
});

// search tasks
const searchInput = document.getElementById("task-search");
searchInput.addEventListener("input", () => {
  searchText = searchInput.value.trim().toLowerCase(); // small letters, so search doesn't care about capitals
  renderTasks(currentView); // show only the matching tasks
});


// Reminder
// every task due today that is not done gets reminded once, reminderSent makes sure it is only once
function sendReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return; // not supported or not allowed

  // collect all the tasks that still need a reminder
  let dueTasks = [];
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.username === username && task.dueDate === today && !task.completed && !task.reminderSent) {
      dueTasks.push(task);
    }
  }

  if (dueTasks.length === 0) return; // nothing to remind

  // one task gets its own message, many tasks get one combined message instead of a pile of pop-ups
  let body = "";
  if (dueTasks.length === 1) body = `Due today: ${dueTasks[0].text}`;
  else body = `${dueTasks.length} tasks due today: ${dueTasks.map((task) => task.text).join(", ")}`;

  const notification = new Notification("Flowdesk", {
    body,
    tag: `task-${dueTasks[0].id}`, // same tag won't show the same reminder twice (e.g. two tabs at once)
  });

  // clicking the notification brings this tab to the front
  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  for (let i = 0; i < dueTasks.length; i++) dueTasks[i].reminderSent = true;
  localStorage.setItem("tasks", JSON.stringify(tasks)); // save, so the reminder isn't sent again after a reload
}

// check again every minute, so tasks added or edited later (or a new day starting while the tab is open) still get reminded
setInterval(() => {
  const now = new Date().toLocaleDateString("en-CA");
  if (now !== today) {
    today = now; // a new day started, so the filters and date check use the new date
    renderTasks(currentView);
  }
  sendReminders();
}, 60000);


// if tasks change in another tab, reload them here so saving in this tab doesn't wipe that tab's changes
window.addEventListener("storage", (event) => {
  if (event.key !== "tasks") return; // some other key changed, not our problem

  tasks = JSON.parse(event.newValue) || []; // newValue is null if the key got removed
  renderTasks(currentView);
});