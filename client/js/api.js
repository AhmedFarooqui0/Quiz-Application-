// api.js — Centralized API client
const BASE_URL = 'http://localhost:5000/api';

const api = {
  async get(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  async post(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  // Categories
  getCategories: () => api.get('/categories'),
  getCategory: (slug) => api.get(`/categories/${slug}`),

  // Questions
  getQuestions: (categorySlug, limit = 10, difficulty = '') => {
    let url = `/questions/${categorySlug}?limit=${limit}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    return api.get(url);
  },

  // Scores
  submitScore: (data) => api.post('/scores', data),
  getLeaderboard: (categoryId = '') => {
    const url = categoryId ? `/scores/leaderboard?categoryId=${categoryId}` : '/scores/leaderboard';
    return api.get(url);
  },
  getCategoryLeaderboard: (categoryId) => api.get(`/scores/leaderboard/${categoryId}`),
};

window.api = api;
