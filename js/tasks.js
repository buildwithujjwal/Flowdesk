// ---------------------------------------------TASKS.HTML--------------------------------------------------------


let tasks = localStorage.getItem("tasks"); // fetched the tasks array from the local storage
tasks = tasks ? JSON.parse(tasks) : []; // if it is null, provide an empty array.

const username = currentUser.username; // currentUser already been fetched in auth-guard.js.
const today = new Date().toISOString().split("T")[0]; //converting the todays date into YYYY-MM-DD format

let currentView = "latestFive"; //default rendering to latest 5 added tasks
renderTasks(currentView);


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
  else if (dueDate < today) error = "Select a valid Date";
  else if (
    tasks.find(
      (task) => task.username === currentUser.username && task.text === text,
    )
  )
    error = "task already exists";
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
    if (tasks[i].username === username) userTasks.push(tasks[i]);
  }

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
      return a.dueDate.localeCompare(b.dueDate); // latest deadline first
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

  // Used Template Literals to make tasks list
  taskList.innerHTML = `
        ${userTasks
          .map((task) => {
            return `
                <li class="task-item" data-id = "${task.id}">
                    <div class="task-info">
                        <input type="checkbox" ${task.completed ? "checked" : ""} onchange="checkbox('${task.id}')">
                        <div>
                            <h3>${task.text}</h3>
                            <p>${task.dueDate}</p>
                        </div>
                    </div>

                    <div class="task-actions">
                        <button type="button">Edit</button>
                        <button type="button"
                        onclick="deleteTask('${task.id}')">Delete</button>
                    </div>
                </li>
            `;
          })
          .join("")}
    `;
}

// Delete task
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(currentView);
}

// CheckBox
function checkbox(id) {
  const task = tasks.find((task) => task.id === id);
  if (task.completed == true) task.completed = false;
  else task.completed = true;

  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(currentView);
}


// button "New Task" clicked
const newTaskBtn = document.getElementById("new-task-btn");
const taskForm = document.getElementById("task-form");

newTaskBtn.addEventListener("click", () => {
  taskForm.style.display = "flex";  
});


// Any filter button clicked
const filterButtons = document.querySelectorAll("[data-filter]"); // All elements that have a data-filter attribute

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    renderTasks(button.dataset.filter); // Access to all data attributes of an element
    taskForm.style.display = "none"; // make the add task form's display none.
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

// Features left before Finalizing Tasks page
// 1) edit button
// 2) search tasks
// 3) remainder (it is to be done after timer page done)
// 4) overall css