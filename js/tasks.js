// fetched the tasks array from the local storage and if it null, provide a empty array.
let tasks = localStorage.getItem("tasks");
tasks = tasks ? JSON.parse(tasks) : [];


// sort and render nearest 5 deadline coming tasks.
tasks.sort((a, b) => {
    return (a.dueDate < b.dueDate);
});
renderTasks(tasks.slice(0, 5));

// Adding a new Task
let addTask = document.getElementById("task-form");
addTask.addEventListener("submit", (event) => {

  // prevent the reloading of page
  event.preventDefault();

  // generate and provide all the keys that are going to save in tasks array to be used later.
  const id = crypto.randomUUID();
  let completed = false;
  const createdAt = Date.now();
  let reminderSent = false;

  // fetched the text and the dueDate, the user filled and also today to compare for invalid dates.
  let text = document.getElementById("task-input").value.trim();
  let dueDate = document.getElementById("dueDate").value;
  const today = new Date().toISOString().split("T")[0];

  // handle all the possible errors.
  let error = "";
  if (!text) error = "task cannot be empty";
  else if (!dueDate) error = "Select the Date";
  else if(dueDate < today) error = "Select a valid Date";
  else if (tasks.find((task) => task.text === text))
    error = "task already exists";
  else {
    // push the object into the array.
    tasks.push({
      id,
      text,
      completed,
      createdAt,
      dueDate,
      reminderSent,
    });

    // pushing the array back into the local storage.
    localStorage.setItem("tasks", JSON.stringify(tasks));

    tasks.sort((a, b) => {
      return (a.dueDate < b.dueDate);
    });
    renderTasks(tasks.slice(0, 5));

    // reseting the fields that user just filled and submitted.
    document.getElementById("task-input").value = "";
    document.getElementById("dueDate").value = "";
  }

  // printing error if any.
  document.getElementById("error").innerHTML = error;
});



// ------------------------renderTask--------------------
function renderTasks(tasks) {
  let taskList = document.getElementById("task-list");

  taskList.innerHTML = `
        ${tasks
          .map((task) => {
            return `
                <li class="task-item" data-id = "${task.id}">
                    <div class="task-info">
                        <input type="checkbox" ${task.completed ? "checked" : ""}>
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

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks(tasks.slice(0, 5));
}