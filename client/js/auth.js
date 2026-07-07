// auth.js — Shared client-side auth helpers.
// Loaded on every page (before app.js / quiz.js / etc.) so the navbar
// and login guard behave consistently across the whole site.

const Auth = {
  TOKEN_KEY: 'devquiz_token',
  USER_KEY: 'devquiz_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = 'login.html';
  },

  // Redirects to the login page (with a "next" param) unless already logged in.
  // Returns true if the user is logged in, false if a redirect just happened.
  requireLogin(reason = 'quiz') {
    if (this.isLoggedIn()) return true;
    const next = encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
    window.location.href = `login.html?next=${next}&reason=${reason}`;
    return false;
  },

  // Builds fetch headers with the Authorization bearer token, if logged in.
  authHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

// Renders the login/signup links or the user chip + logout button
// into any element with id="nav-auth-slot" found on the page.
function renderNavAuth() {
  const slot = document.getElementById('nav-auth-slot');
  if (!slot) return;

  const user = Auth.getUser();

  if (user) {
    const initial = (user.name || '?').trim().charAt(0).toUpperCase();
    slot.innerHTML = `
      <div class="nav-auth">
        <div class="nav-user-chip" title="${user.email}">
          <span class="nav-user-avatar">${initial}</span>
          <span>${user.name}</span>
        </div>
        <button class="btn btn-ghost btn-sm" id="nav-logout-btn">Logout</button>
      </div>
    `;
    document.getElementById('nav-logout-btn').addEventListener('click', () => Auth.logout());
  } else {
    slot.innerHTML = `
      <div class="nav-auth">
        <a href="login.html" class="btn btn-ghost btn-sm">Log In</a>
        <a href="signup.html" class="btn btn-primary btn-sm">Sign Up</a>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', renderNavAuth);
