// Task Manager Application
let currentTask = null;
let autoScrollInterval = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadTasksFromStorage();
    setupEventListeners();
});

function setupEventListeners() {
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskInput = document.getElementById('taskInput');
    const cancelBtn = document.getElementById('cancelBtn');
    const modal = document.getElementById('quadrantModal');

    addTaskBtn.addEventListener('click', () => {
        const taskText = taskInput.value.trim();
        if (taskText) {
            currentTask = taskText;
            showModal();
            taskInput.value = '';
        }
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaskBtn.click();
        }
    });

    cancelBtn.addEventListener('click', hideModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Setup quadrant buttons in modal
    const quadrantButtons = document.querySelectorAll('.quadrant-btn');
    quadrantButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetQuadrant = btn.getAttribute('data-target');
            addTaskToQuadrant(currentTask, targetQuadrant);
            hideModal();
            currentTask = null;
        });
    });

    // Setup drag and drop for all containers
    setupDragAndDrop();
}

function showModal() {
    const modal = document.getElementById('quadrantModal');
    modal.classList.add('active');
}

function hideModal() {
    const modal = document.getElementById('quadrantModal');
    modal.classList.remove('active');
}

function addTaskToQuadrant(taskText, quadrantId) {
    const container = document.getElementById(quadrantId);
    const taskElement = createTaskElement(taskText, quadrantId);
    container.appendChild(taskElement);
    saveTasksToStorage();
}

function createTaskElement(text, quadrantId) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.draggable = true;
    taskItem.dataset.quadrant = quadrantId;

    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
        // Trigger confetti effect
        triggerConfetti();
        
        // Remove task with animation
        taskItem.style.transform = 'scale(0.8)';
        taskItem.style.opacity = '0';
        setTimeout(() => {
            taskItem.remove();
            saveTasksToStorage();
        }, 200);
    });

    taskItem.appendChild(taskText);
    taskItem.appendChild(deleteBtn);

    // Add drag event listeners
    taskItem.addEventListener('dragstart', handleDragStart);
    taskItem.addEventListener('dragend', handleDragEnd);

    return taskItem;
}

function setupDragAndDrop() {
    const containers = document.querySelectorAll('.tasks-container');
    
    containers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('dragenter', handleDragEnter);
    });
}

function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    e.dataTransfer.setData('quadrant', this.dataset.quadrant);
    
    // Start auto-scroll monitoring
    startAutoScroll();
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Stop auto-scroll
    stopAutoScroll();
    
    // Remove drag-over class from all quadrants
    document.querySelectorAll('.quadrant').forEach(q => {
        q.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    const quadrant = this.closest('.quadrant');
    if (quadrant) {
        quadrant.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const quadrant = this.closest('.quadrant');
    if (quadrant && e.target === this) {
        quadrant.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    const draggedElement = document.querySelector('.dragging');
    
    if (draggedElement) {
        const newQuadrantId = this.id;
        const taskText = draggedElement.querySelector('.task-text').textContent;
        
        // Remove the old task
        draggedElement.remove();
        
        // Add task to new quadrant
        addTaskToQuadrant(taskText, newQuadrantId);
    }

    // Remove drag-over class
    document.querySelectorAll('.quadrant').forEach(q => {
        q.classList.remove('drag-over');
    });

    return false;
}

// Local Storage Functions
function saveTasksToStorage() {
    const tasks = {
        'urgent-important': [],
        'not-urgent-important': [],
        'urgent-not-important': [],
        'not-urgent-not-important': []
    };

    Object.keys(tasks).forEach(quadrantId => {
        const container = document.getElementById(quadrantId);
        const taskElements = container.querySelectorAll('.task-item');
        
        taskElements.forEach(taskEl => {
            const text = taskEl.querySelector('.task-text').textContent;
            tasks[quadrantId].push(text);
        });
    });

    localStorage.setItem('eisenhowerTasks', JSON.stringify(tasks));
}

function loadTasksFromStorage() {
    const savedTasks = localStorage.getItem('eisenhowerTasks');
    
    if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        
        Object.keys(tasks).forEach(quadrantId => {
            const container = document.getElementById(quadrantId);
            container.innerHTML = ''; // Clear existing tasks
            
            tasks[quadrantId].forEach(taskText => {
                const taskElement = createTaskElement(taskText, quadrantId);
                container.appendChild(taskElement);
            });
        });
    }
}

// Auto-scroll functionality
function startAutoScroll() {
    if (autoScrollInterval) return;
    
    autoScrollInterval = setInterval(() => {
        const draggedElement = document.querySelector('.dragging');
        if (!draggedElement) {
            stopAutoScroll();
            return;
        }
        
        // Get mouse position (stored during drag)
        const mouseY = window.lastMouseY || 0;
        const windowHeight = window.innerHeight;
        const scrollThreshold = 150; // pixels from edge to trigger scroll
        const scrollSpeed = 10; // pixels per interval
        
        // Scroll down if near bottom
        if (mouseY > windowHeight - scrollThreshold) {
            window.scrollBy({
                top: scrollSpeed,
                behavior: 'auto'
            });
        }
        
        // Scroll up if near top
        if (mouseY < scrollThreshold) {
            window.scrollBy({
                top: -scrollSpeed,
                behavior: 'auto'
            });
        }
    }, 16); // ~60fps
}

function stopAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
}

// Track mouse position during drag
document.addEventListener('dragover', (e) => {
    window.lastMouseY = e.clientY;
});

// Confetti effect when completing a task
function triggerConfetti() {
    const count = 50;
    const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999
    };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
            spread: 60,
            startVelocity: 30,
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });

    fire(0.2, {
        spread: 60,
    });

    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
    });

    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
    });

    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
}
