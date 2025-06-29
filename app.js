class TaskFlowApp {
  constructor() {
    this.currentStage = 'todo';
    this.tasks = {
      todo: [],
      completed: [],
      archived: []
    };
    
    this.initializeElements();
    this.init();
  }

  initializeElements() {
    this.userAvatar = document.getElementById('userAvatar');
    this.userName = document.getElementById('userName');
    this.signOutBtn = document.getElementById('signOutBtn');
    this.taskInput = document.getElementById('taskInput');
    this.addTaskBtn = document.getElementById('addTaskBtn');
    this.todoList = document.getElementById('todoList');
    this.completedList = document.getElementById('completedList');
    this.archivedList = document.getElementById('archivedList');
    this.todoCount = document.getElementById('todoCount');
    this.completedCount = document.getElementById('completedCount');
    this.archivedCount = document.getElementById('archivedCount');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.taskLists = document.querySelectorAll('.task-list');
  }

  async init() {
    if (!this.checkAuth()) {
      window.location.href = './index.html';
      return;
    }

    this.loadUserData();

    this.setupEventListeners();

    await this.loadTasks();

    this.hideLoading();
  }

  checkAuth() {
    const userData = localStorage.getItem('taskflow_user');
    if (!userData) return false;
    
    try {
      const user = JSON.parse(userData);
      return user.name && user.dateOfBirth;
    } catch (error) {
      return false;
    }
  }

  loadUserData() {
    const userData = JSON.parse(localStorage.getItem('taskflow_user'));
    const name = userData.name;
    
    this.userName.textContent = name;
    this.userAvatar.src = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(name)}`;
  }

  setupEventListeners() {
    this.signOutBtn.addEventListener('click', () => this.signOut());
    this.addTaskBtn.addEventListener('click', () => this.addTask());
    this.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });
    
    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const stage = button.dataset.tab;
        this.switchTab(stage);
      });
    });
  }

  switchTab(stage) {
    this.currentStage = stage;
    
    this.tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === stage) {
        btn.classList.add('active');
      }
    });
    
    this.taskLists.forEach(list => {
      list.classList.remove('active');
      if (list.dataset.stage === stage) {
        list.classList.add('active');
      }
    });
    
    const placeholders = {
      todo: 'What needs to be done?',
      completed: 'Add a completed task...',
      archived: 'Add an archived task...'
    };
    this.taskInput.placeholder = placeholders[stage];
  }

  async loadTasks() {
    const existingTasks = localStorage.getItem('taskflow_tasks');
    
    if (existingTasks) {
      this.tasks = JSON.parse(existingTasks);
    } else {
      await this.fetchInitialData();
    }
    
    this.renderAllTasks();
    this.updateCounts();
  }

  async fetchInitialData() {
    try {
      const response = await fetch('https://dummyjson.com/todos');
      const data = await response.json();
      
      this.tasks.todo = data.todos.slice(0, 8).map(todo => ({
        id: this.generateId(),
        text: todo.todo,
        stage: 'todo',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }));
      
      this.saveTasks();
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      this.tasks.todo = [
        {
          id: this.generateId(),
          text: 'Welcome to TaskFlow! Click to complete this task.',
          stage: 'todo',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      ];
      this.saveTasks();
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  addTask() {
    const text = this.taskInput.value.trim();
    if (!text) return;
    
    const task = {
      id: this.generateId(),
      text: text,
      stage: this.currentStage,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    this.tasks[this.currentStage].push(task);
    this.taskInput.value = '';
    
    this.saveTasks();
    this.renderTasks(this.currentStage);
    this.updateCounts();
    
    setTimeout(() => {
      const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
      if (taskElement) {
        taskElement.classList.add('task-added');
      }
    }, 100);
  }

  moveTask(taskId, fromStage, toStage) {
    const taskIndex = this.tasks[fromStage].findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    const task = this.tasks[fromStage].splice(taskIndex, 1)[0];
    task.stage = toStage;
    task.lastModified = new Date().toISOString();
    
    this.tasks[toStage].push(task);
    
    this.saveTasks();
    this.renderAllTasks();
    this.updateCounts();
  }

  renderAllTasks() {
    Object.keys(this.tasks).forEach(stage => {
      this.renderTasks(stage);
    });
  }

  renderTasks(stage) {
    const targetList = document.getElementById(`${stage}List`);
    targetList.innerHTML = '';
    
    this.tasks[stage].forEach(task => {
      this.renderTask(task, stage, targetList);
    });
  }

  renderTask(task, stage, targetList) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-card';
    taskElement.dataset.taskId = task.id;
    
    const lastModified = new Date(task.lastModified);
    const formattedDate = lastModified.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    taskElement.innerHTML = `
      <div class="task-content">
        <p class="task-text">${this.escapeHtml(task.text)}</p>
        <div class="task-meta">
          <span class="task-timestamp">Modified: ${formattedDate}</span>
        </div>
      </div>
      <div class="task-actions">
        ${this.getTaskActions(task.id, stage)}
      </div>
    `;
    
    targetList.appendChild(taskElement);
  }

  getTaskActions(taskId, stage) {
    const actions = [];
    
    switch (stage) {
      case 'todo':
        actions.push(`<button class="action-btn complete-btn" onclick="window.app.moveTask('${taskId}', 'todo', 'completed')">Complete</button>`);
        actions.push(`<button class="action-btn archive-btn" onclick="window.app.moveTask('${taskId}', 'todo', 'archived')">Archive</button>`);
        break;
      case 'completed':
        actions.push(`<button class="action-btn todo-btn" onclick="window.app.moveTask('${taskId}', 'completed', 'todo')">Move to Todo</button>`);
        actions.push(`<button class="action-btn archive-btn" onclick="window.app.moveTask('${taskId}', 'completed', 'archived')">Archive</button>`);
        break;
      case 'archived':
        actions.push(`<button class="action-btn todo-btn" onclick="window.app.moveTask('${taskId}', 'archived', 'todo')">Move to Todo</button>`);
        actions.push(`<button class="action-btn complete-btn" onclick="window.app.moveTask('${taskId}', 'archived', 'completed')">Move to Completed</button>`);
        break;
    }
    
    return actions.join('');
  }

  updateCounts() {
    this.todoCount.textContent = this.tasks.todo.length;
    this.completedCount.textContent = this.tasks.completed.length;
    this.archivedCount.textContent = this.tasks.archived.length;
  }

  saveTasks() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
  }

  signOut() {
    if (confirm('Are you sure you want to sign out? Your tasks will be saved for when you return.')) {
      localStorage.removeItem('taskflow_user');
      window.location.href = './index.html';
    }
  }

  hideLoading() {
    setTimeout(() => {
      this.loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        this.loadingOverlay.style.display = 'none';
      }, 300);
    }, 1000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new TaskFlowApp();
});