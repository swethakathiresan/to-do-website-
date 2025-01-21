let editMode = false; 
let editingTaskId = null; 
let isloading = false;
let taskToDeleteId = null;

function showLoader() {
    isloading = true;
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    isloading = false;
    document.getElementById('loader').style.display = 'none';
}

function showHome() {
    showLoader();
    document.getElementById('homeContent').style.display = 'block';
    document.getElementById('trashContent').style.display = 'none';
    document.getElementById('homeTab').classList.add('active');
    document.getElementById('trashTab').classList.remove('active');
    fetchTasks(); 
}

function showTrash() {
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('trashContent').style.display = 'block';
    document.getElementById('trashTab').classList.add('active');
    document.getElementById('homeTab').classList.remove('active');
    fetchTrash(); 
}

async function fetchTasks() {
    showLoader();
    const response = await fetch('http://localhost:3000/tasks');
    const tasks = await response.json();
    const filteredTasks = tasks.filter(task => task.deleted === 0);
    displayTasks(filteredTasks);
    hideLoader();
}

async function fetchTrash() {
    showLoader();
    const response = await fetch('http://localhost:3000/tasks/trash');
    const tasks = await response.json();
    tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    displayTrash(tasks);
    hideLoader();
}

function displayTasks(tasks) {
    const taskContainer = document.getElementById('taskContainer');
    taskContainer.innerHTML = ''; 
    const today = new Date(); 
    today.setHours(0, 0, 0, 0); 

    if (tasks.length === 0) {
        taskContainer.innerHTML = '<p>No tasks available.</p>';
    } else {
        tasks.reverse().forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task';
            const formattedDueDate = new Date(task.due_date);
            const createdAtDate = new Date(task.createdAt);
            const formattedCreatedAt = isNaN(createdAtDate) ? "N/A" : createdAtDate.toLocaleDateString(); 

            let statusText = task.status; 
            if (formattedDueDate < today) {
                statusText = 'Over Due'; 
            }

            taskElement.innerHTML = `
                <div class="task-title">${task.title}</div>
                <div class="task-details">${task.description}</div>
                <div class="task-details">Due Date: ${formattedDueDate.toLocaleDateString()}</div>
                <div class="task-details status ${statusText === 'Pending' ? 'status-pending' : statusText === 'In Progress' ? 'status-in-progress' : statusText === 'Completed' ? 'status-completed' : 'status-overdue'}">Status: ${statusText}</div>
                <div class="task-details">Created At: ${formattedCreatedAt}</div>
                <button onclick="openPopup(${JSON.stringify(task).replace(/"/g, '&quot;')})">Edit</button>
                <button onclick="deleteTask(${task.id})">Delete</button>
            `;
            taskContainer.appendChild(taskElement);
        });
    }
}


function displayTrash(tasks) {
    const trashContainer = document.getElementById('trashContainer');
    trashContainer.innerHTML = ''; 
    if (tasks.length === 0) {
        trashContainer.innerHTML = '<p>No tasks in trash.</p>';
    } else {
        tasks.reverse().forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task';
            const formattedDueDate = new Date(task.due_date).toLocaleDateString();
            taskElement.innerHTML = `
                <div class="task-title">${task.title}</div>
                <div class="task-details">${task.description}</div>
                <div class="task-details">Due Date: ${formattedDueDate}</div>
                <div class="task-details">Status: Deleted</div>
                <button onclick="restoreTask(${task.id})">Restore</button>
                <button onclick="showPermanentConfirmation(${task.id})">Delete Permanently</button>
            `;
            trashContainer.appendChild(taskElement);
        });
    }
}

function openPopup(task = null) {
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('overlay');
    const formTitle = document.getElementById('popupTitle');
    const submitButton = document.getElementById('submitButton');
    const createdAField = document.getElementById('createdAt');

    popup.style.display = 'block';
    overlay.style.display = 'block';

    if (task) {
        editMode = true;
        editingTaskId = task.id;
        formTitle.innerText = 'Edit Task';
        submitButton.innerText = 'Update';

        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('dueDate').value = task.due_date.split('T')[0]; 
        document.getElementById('status').value = task.status; 
        createdAField.value = task.createdAt.split('T')[0];
        createdAField.disabled = true;

    } else {
        editMode = false;
        editingTaskId = null;
        formTitle.innerText = 'Add Task';
        submitButton.innerText = 'Add';
        document.getElementById('taskForm').reset(); 
        document.getElementById('status').value = 'Pending';
        const now = new Date();
        const formattedDate = now.toISOString().split('T')[0];
        createdAField.disabled = false; 
        createdAField.value = formattedDate;
        document.getElementById('createdAt').value = formattedDate;
         
    }
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('taskForm').reset();
    editMode = false; 
    editingTaskId = null;
}

async function addTask(event) {
    event.preventDefault(); 
    showLoader();
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const due_date = document.getElementById('dueDate').value;
    const status = document.getElementById('status').value; 
    const createdAt = document.getElementById('createdAt').value;

    console.log('Created At before submission:', createdAt); 

    if (editMode && editingTaskId) {
        await fetch(`http://localhost:3000/tasks/${editingTaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description, due_date, status, createdAt }),
        });
    } else {
        await fetch('http://localhost:3000/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description, due_date, status, createdAt }),
        });
    }
    hideLoader();
    closePopup();
    fetchTasks(); 
}


async function deleteTask(id) {
    taskToDeleteId = id; 
    showConfirmation();
}

async function confirmPermanentDelete(id) {
    taskToDeleteId = id; 
    showConfirmation();
}


function showConfirmation() {
    document.getElementById('confirmationPopup').style.display = 'block';
    document.getElementById('confirmationOverlay').style.display = 'block';
}

function closeConfirmation() {
    document.getElementById('confirmationPopup').style.display = 'none';
    document.getElementById('confirmationOverlay').style.display = 'none';
}

function showPermanentConfirmation() {
    document.getElementById('permanentConfirmationPopup').style.display = 'block';
    document.getElementById('permanentConfirmationOverlay').style.display = 'block';
}

function closePermanentConfirmation() {
    document.getElementById('permanentConfirmationPopup').style.display = 'none';
    document.getElementById('permanentConfirmationOverlay').style.display = 'none';
}

async function confirmDelete() {
    if (taskToDeleteId) {
        showLoader(); 
        try {
            const response = await fetch(`http://localhost:3000/tasks/${taskToDeleteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ deleted: 1 }), 
            });

            if (response.ok) {
                console.log('Task moved to trash successfully');
                await fetchTasks(); 
            } else {
                console.error('Failed to move task to trash:', response.statusText);
            }
        } catch (error) {
            console.error('Error while moving task to trash:', error);
        } finally {
            hideLoader(); 
            closeConfirmation(); 
        }
    }
}

async function confirmPermanentDelete() {
    if (taskToDeleteId) {
        showLoader(); 
        try {
            const response = await fetch(`http://localhost:3000/tasks/${taskToDeleteId}`, {
                method: 'DELETE', 
            });

            if (response.ok) {
                console.log('Task permanently deleted');
                await fetchTrash(); 
            } else {
                console.error('Failed to permanently delete task:', response.statusText);
            }
        } catch (error) {
            console.error('Error while permanently deleting task:', error);
        } finally {
            hideLoader(); 
            closePermanentConfirmation(); 
        }
    }
}


async function restoreTask(id) {
    showLoader();
    const response = await fetch(`http://localhost:3000/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleted: 0 }), 
    });
    if (response.ok) {
        console.log('Task restored successfully');
        fetchTrash(); 
    } else {
        console.error('Failed to restore task:', response.statusText);
    }
    hideLoader();
}

function setMinDueDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; 
        document.getElementById('dueDate').setAttribute('min', formattedDate);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const formattedYesterday = yesterday.toISOString().split('T')[0];
        document.getElementById('createdAt').setAttribute('min', formattedYesterday);
        document.getElementById('createdAt').setAttribute('max', formattedDate);
    }

    window.onload = function() {
        fetchTasks(); 
        setMinDueDate(); 
    };
