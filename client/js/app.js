// app.js — Home page logic
let allCategories = [];

const categoryColors = {
  '#ff4d6d': '#ff4d6d',
  '#f5a623': '#f5a623',
  '#00e5a0': '#00e5a0',
  '#4f8ef7': '#4f8ef7',
  '#a78bfa': '#a78bfa',
  '#00d4aa': '#00d4aa',
  '#ffc542': '#ffc542',
  '#ff6b9d': '#ff6b9d',
  '#38bdf8': '#38bdf8',
  '#fb923c': '#fb923c',
};

// Toast Notifications
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

// Render a single category card
function renderCategoryCard(cat) {
  const colorMap = {
    'bad-coding-practices': '#ff4d6d',
    'security-vulnerabilities': '#f5a623',
    'software-testing': '#00e5a0',
    'version-control': '#4f8ef7',
    'database-design': '#a78bfa',
    'api-design': '#00d4aa',
    'debugging-errors': '#ffc542',
    'software-architecture': '#ff6b9d',
    'agile-management': '#38bdf8',
    'devops-deployment': '#fb923c',
  };
  const color = colorMap[cat.slug] || cat.color || '#4f8ef7';
  const diffLabel = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

  return `
    <div class="category-card animate-fade-up" style="--card-color: ${color}" onclick="startQuiz('${cat.slug}', '${cat._id}')">
      <span class="card-icon">${cat.icon}</span>
      <div class="card-name">${cat.name}</div>
      <div class="card-desc">${cat.description}</div>
      <div class="card-meta">
        <span class="difficulty-badge difficulty-${cat.difficulty}">${diffLabel[cat.difficulty] || cat.difficulty}</span>
        <span class="card-questions">⏱ ${cat.timePerQuestion}s/question</span>
        <span class="card-arrow">→</span>
      </div>
    </div>
  `;
}

// Load categories from API
async function loadCategories() {
  const loading = document.getElementById('categories-loading');
  const error = document.getElementById('categories-error');
  const grid = document.getElementById('categories-grid');

  loading.style.display = 'block';
  error.style.display = 'none';
  grid.style.display = 'none';

  try {
    const data = await api.getCategories();
    allCategories = data.data;

    grid.innerHTML = allCategories.map((cat, i) => {
      const el = renderCategoryCard(cat);
      return el.replace('animate-fade-up', `animate-fade-up delay-${Math.min(i + 1, 5)}`);
    }).join('');

    loading.style.display = 'none';
    grid.style.display = 'grid';
  } catch (err) {
    loading.style.display = 'none';
    error.style.display = 'block';
    document.getElementById('error-msg').textContent = err.message || 'Server unavailable. Run: cd server && npm run dev';
  }
}

// Filter by difficulty
document.getElementById('difficulty-filter').addEventListener('change', function () {
  const grid = document.getElementById('categories-grid');
  if (!allCategories.length) return;

  const val = this.value;
  const filtered = val ? allCategories.filter(c => c.difficulty === val) : allCategories;

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>No categories match this difficulty.</p></div>';
  } else {
    grid.innerHTML = filtered.map((cat, i) => {
      const el = renderCategoryCard(cat);
      return el.replace('animate-fade-up', `animate-fade-up delay-${Math.min(i + 1, 5)}`);
    }).join('');
  }
});

// Start quiz — navigate to quiz.html (login required)
function startQuiz(slug, id) {
  if (!Auth.isLoggedIn()) {
    showToast('Please log in to take a quiz', 'info');
    window.location.href = `login.html?next=index.html&reason=quiz`;
    return;
  }
  sessionStorage.setItem('quiz_slug', slug);
  sessionStorage.setItem('quiz_cat_id', id);
  window.location.href = 'quiz.html';
}

// Random quiz button
document.getElementById('random-quiz-btn').addEventListener('click', () => {
  if (!allCategories.length) {
    showToast('Categories are still loading...', 'info');
    return;
  }
  const rand = allCategories[Math.floor(Math.random() * allCategories.length)];
  startQuiz(rand.slug, rand._id);
});

// Init
loadCategories();
