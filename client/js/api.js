// api.js — Centralized API client
const BASE_URL = 'http://localhost:5000/api';

// Adds the Authorization header when a token exists, without api.js
// needing to know about the Auth object's internal storage details.
function authHeader() {
  const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('devquiz_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const api = {
  async get(endpoint, { auth = false } = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: auth ? authHeader() : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.message || `Request failed: ${res.status}`);
      e.status = res.status;
      e.code = err.code;
      throw e;
    }
    return res.json();
  },

  async post(endpoint, body, { auth = false } = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? authHeader() : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.message || `Request failed: ${res.status}`);
      e.status = res.status;
      e.code = err.code;
      throw e;
    }
    return res.json();
  },

  // Auth
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  getMe: () => api.get('/auth/me', { auth: true }),

  // Categories
  getCategories: () => api.get('/categories'),
  getCategory: (slug) => api.get(`/categories/${slug}`),

  // Questions (requires login — a quiz can only be taken while signed in)
  getQuestions: (categorySlug, limit = 10, difficulty = '') => {
    let url = `/questions/${categorySlug}?limit=${limit}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    return api.get(url, { auth: true });
  },

  // Scores (submitting requires login; leaderboard is public)
  submitScore: (data) => api.post('/scores', data, { auth: true }),
  getLeaderboard: (categoryId = '') => {
    const url = categoryId ? `/scores/leaderboard?categoryId=${categoryId}` : '/scores/leaderboard';
    return api.get(url);
  },
  getCategoryLeaderboard: (categoryId) => api.get(`/scores/leaderboard/${categoryId}`),
};

window.api = api;
