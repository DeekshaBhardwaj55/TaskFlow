// Landing page functionality
class WelcomeApp {
  constructor() {
    this.form = document.getElementById('welcome-form');
    this.nameInput = document.getElementById('userName');
    this.dobInput = document.getElementById('dateOfBirth');
    this.nameError = document.getElementById('nameError');
    this.ageError = document.getElementById('ageError');
    
    this.init();
  }

  init() {
    this.checkExistingUser();
    
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    this.nameInput.addEventListener('input', () => this.validateName());
    this.dobInput.addEventListener('change', () => this.validateAge());
    
    this.dobInput.max = new Date().toISOString().split('T')[0];
  }

  checkExistingUser() {
    const userData = localStorage.getItem('taskflow_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.name && user.dateOfBirth && this.isValidAge(user.dateOfBirth)) {
          window.location.href = './app.html';
        }
      } catch (error) {
        console.warn('Invalid user data found, clearing localStorage');
        localStorage.removeItem('taskflow_user');
      }
    }
  }

  validateName() {
    const name = this.nameInput.value.trim();
    this.nameError.textContent = '';
    
    if (name.length === 0) {
      return false;
    }
    
    if (name.length < 2) {
      this.nameError.textContent = 'Name must be at least 2 characters long';
      return false;
    }
    
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      this.nameError.textContent = 'Name can only contain letters and spaces';
      return false;
    }
    
    return true;
  }

  validateAge() {
    const dob = this.dobInput.value;
    this.ageError.textContent = '';
    
    if (!dob) {
      return false;
    }
    
    if (!this.isValidAge(dob)) {
      this.ageError.textContent = 'You must be over 10 years old to use TaskFlow';
      return false;
    }
    
    return true;
  }

  isValidAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 > 10;
    }
    
    return age > 10;
  }

  handleSubmit(e) {
    e.preventDefault();
    
    const isNameValid = this.validateName();
    const isAgeValid = this.validateAge();
    
    if (!isNameValid || !isAgeValid) {
      return;
    }
    
    const userData = {
      name: this.nameInput.value.trim(),
      dateOfBirth: this.dobInput.value,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('taskflow_user', JSON.stringify(userData));
    
    window.location.href = './app.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WelcomeApp();
});