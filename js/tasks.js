// TaskForm
// This part submits the task and dueDate given in the local storage in a tasks array with many keys.
let taskForm = document.getElementById("task-form");
taskForm.addEventListener("submit", (event) => {

    // prevent the reloading of page
    event.preventDefault();

    // generate and provide all the keys that are going to save in tasks array to be used later.
    let id = crypto.randomUUID();
    let completed = false;
    let createdAt = Date.now();
    let reminderSent = false;

    // fetched the text and the dueDate, the user filled.
    let text = document.getElementById("task-input").value.trim();
    let dueDate = document.getElementById("dueDate").value;
    
    // fetched the tasks array from the local storage and if it null, provide a empty array.
    let tasks = localStorage.getItem("tasks");
    tasks = tasks ? JSON.parse(tasks) : [];

    // handle all the possible errors.
    let error = "";
    if(!text) error = "task cannot be empty";
    else if(!dueDate) error = "Select the Date";

    else if(tasks.find(task => task.text === text))error = "task already exists";

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
        
        // renderTasks(tasks);

        // reseting the fields that user just filled and submitted.
        document.getElementById("task-input").value = "";
        document.getElementById("dueDate").value = "";
    }

    // printing error if any.
    document.getElementById("error").innerHTML = error;
}); 