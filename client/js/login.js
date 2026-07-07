// login.js — Login page logic

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
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  } else {
    input.classList.remove('input-error');
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
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

function validatePasswordField() {
  const password = document.getElementById('password-input').value;
  if (!password) {
    setFieldError('password-input', 'password-error', 'Password is required');
    return false;
  }
  setFieldError('password-input', 'password-error', null);
  return true;
}

document.getElementById('email-input').addEventListener('blur', validateEmailField);
document.getElementById('password-input').addEventListener('blur', validatePasswordField);

document.getElementById('toggle-password').addEventListener('click', function () {
  const input = document.getElementById('password-input');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  this.textContent = isHidden ? 'Hide' : 'Show';
});

// Handle redirect from email verification link / "please log in" guard
(function handleQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const verified = params.get('verified');
  const reason = params.get('reason');

  if (verified === 'success') {
    showAlert('✅ Email verified! You can now log in.', 'success');
  } else if (verified === 'error') {
    const messages = {
      expired: 'That verification link has expired. Please request a new one below.',
      invalid: 'That verification link is invalid.',
      server: 'Something went wrong verifying your email. Please try again.',
    };
    showAlert(messages[reason] || 'Could not verify your email.', 'error');
    document.getElementById('resend-wrapper').style.display = 'block';
  } else if (params.get('reason') === 'quiz') {
    showAlert('Please log in to take a quiz.', 'info');
  }
})();

document.getElementById('resend-link').addEventListener('click', async function (e) {
  e.preventDefault();
  const email = document.getElementById('email-input').value.trim();
  if (!EMAIL_REGEX.test(email)) {
    showAlert('Enter your email above first, then click resend.', 'error');
    document.getElementById('email-input').focus();
    return;
  }
  try {
    const result = await api.resendVerification(email);
    showAlert(result.message, 'success');
  } catch (err) {
    showAlert(err.message || 'Could not resend verification email.', 'error');
  }
});

document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const emailOk = validateEmailField();
  const passwordOk = validatePasswordField();
  if (!emailOk || !passwordOk) return;

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;

    const result = await api.login({ email, password });
    Auth.setSession(result.token, result.user);

    showToast(`Welcome back, ${result.user.name}!`, 'success');

    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    window.location.href = next && next !== 'login.html' && next !== 'signup.html' ? next : 'index.html';
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Log In';

    if (err.code === 'NOT_VERIFIED') {
      showAlert(err.message, 'error');
      document.getElementById('resend-wrapper').style.display = 'block';
    } else {
      showAlert(err.message || 'Invalid email or password', 'error');
    }
  }
});
