// signup.js — Signup page logic & client-side validation

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function showAlert(message, type = 'info') {
  const alertBox = document.getElementById('auth-alert');
  alertBox.textContent = message;
  alertBox.className = `auth-alert visible ${type}`;
}

function setFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);
  if (message) {
    input.classList.add('input-error');
    input.classList.remove('input-valid');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  } else {
    input.classList.remove('input-error');
    input.classList.add('input-valid');
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}

function validateNameField() {
  const name = document.getElementById('name-input').value.trim();
  if (name.length < 2) {
    setFieldError('name-input', 'name-error', 'Name must be at least 2 characters');
    return false;
  }
  if (name.length > 50) {
    setFieldError('name-input', 'name-error', 'Name must be under 50 characters');
    return false;
  }
  setFieldError('name-input', 'name-error', null);
  return true;
}

function validateEmailField() {
  const email = document.getElementById('email-input').value.trim();
  if (!EMAIL_REGEX.test(email)) {
    setFieldError('email-input', 'email-error', 'Enter a valid email address');
    return false;
  }
  setFieldError('email-input', 'email-error', null);
  return true;
}

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 12) score++;
  return Math.min(score, 3);
}

function renderPasswordStrength(password) {
  const bars = document.querySelectorAll('#password-strength .strength-bar');
  const strength = password ? passwordStrength(password) : 0;
  const labels = ['weak', 'weak', 'medium', 'strong'];
  bars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (i < strength) bar.classList.add(labels[strength]);
  });
}

function validatePasswordField() {
  const password = document.getElementById('password-input').value;
  if (password.length < 8) {
    setFieldError('password-input', 'password-error', 'Password must be at least 8 characters');
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    setFieldError('password-input', 'password-error', 'Include at least one uppercase letter');
    return false;
  }
  if (!/[a-z]/.test(password)) {
    setFieldError('password-input', 'password-error', 'Include at least one lowercase letter');
    return false;
  }
  if (!/[0-9]/.test(password)) {
    setFieldError('password-input', 'password-error', 'Include at least one number');
    return false;
  }
  setFieldError('password-input', 'password-error', null);
  return true;
}

function validateConfirmPasswordField() {
  const password = document.getElementById('password-input').value;
  const confirm = document.getElementById('confirm-password-input').value;
  if (confirm !== password || confirm.length === 0) {
    setFieldError('confirm-password-input', 'confirm-password-error', 'Passwords do not match');
    return false;
  }
  setFieldError('confirm-password-input', 'confirm-password-error', null);
  return true;
}

// Live validation as the user types
document.getElementById('name-input').addEventListener('blur', validateNameField);
document.getElementById('email-input').addEventListener('blur', validateEmailField);
document.getElementById('password-input').addEventListener('input', (e) => {
  renderPasswordStrength(e.target.value);
  validatePasswordField();
  if (document.getElementById('confirm-password-input').value) validateConfirmPasswordField();
});
document.getElementById('confirm-password-input').addEventListener('input', validateConfirmPasswordField);

// Show/hide password
document.getElementById('toggle-password').addEventListener('click', function () {
  const input = document.getElementById('password-input');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  this.textContent = isHidden ? 'Hide' : 'Show';
});

// Submit
document.getElementById('signup-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nameOk = validateNameField();
  const emailOk = validateEmailField();
  const passwordOk = validatePasswordField();
  const confirmOk = validateConfirmPasswordField();

  if (!nameOk || !emailOk || !passwordOk || !confirmOk) {
    showAlert('Please fix the highlighted fields.', 'error');
    return;
  }

  const btn = document.getElementById('signup-btn');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const name = document.getElementById('name-input').value.trim();
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;

    const result = await api.signup({ name, email, password });

    Auth.setSession(result.token, result.user);
    showToast(`Welcome, ${result.user.name}!`, 'success');
    btn.textContent = 'Account Created ✓';

    window.location.href = 'index.html';
  } catch (err) {
    showAlert(err.message || 'Something went wrong. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});
