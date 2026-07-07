// leaderboard.js — Leaderboard Page Logic
let categories = [];
let activeCategory = '';

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3500);
}

function formatTime(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadLeaderboard(categoryId = '') {
  const loading = document.getElementById('lb-loading');
  const errorEl = document.getElementById('lb-error');
  const list = document.getElementById('lb-list');

  loading.style.display = 'block';
  errorEl.style.display = 'none';
  list.style.display = 'none';

  try {
    let data;
    if (categoryId) {
      data = await api.getCategoryLeaderboard(categoryId);
    } else {
      data = await api.getLeaderboard();
    }

    const scores = data.data;
    list.style.display = 'flex';
    loading.style.display = 'none';

    if (!scores.length) {
      list.innerHTML = `
        <div class="no-scores">
          <div class="no-scores-icon">🏁</div>
          <p>No scores yet for this category.</p>
          <a href="index.html" class="btn btn-primary" style="margin-top:16px;">Take a Quiz!</a>
        </div>
      `;
      return;
    }

    list.innerHTML = scores.map((s, i) => {
      const rank = i + 1;
      let rankEl;
      if (rank === 1) rankEl = `<span class="rank-badge rank-1">🥇</span>`;
      else if (rank === 2) rankEl = `<span class="rank-badge rank-2">🥈</span>`;
      else if (rank === 3) rankEl = `<span class="rank-badge rank-3">🥉</span>`;
      else rankEl = `<span class="rank-badge rank-other">${rank}</span>`;

      const pctColor = s.percentage >= 90 ? 'text-green' : s.percentage >= 70 ? 'text-blue' : 'text-amber';

      return `
        <div class="leaderboard-row" style="animation-delay: ${i * 0.06}s">
          ${rankEl}
          <div>
            <div class="lb-player-name">${escapeHtml(s.playerName)}</div>
            <div class="lb-meta">${s.categoryName} · ${formatDate(s.createdAt)} · ⏱ ${formatTime(s.timeTaken)}</div>
          </div>
          <div class="lb-score-col">
            <div class="lb-percentage ${pctColor}">${s.percentage}%</div>
            <div class="lb-score-raw">${s.score}/${s.total}</div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    loading.style.display = 'none';
    errorEl.style.display = 'block';
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function filterLeaderboard(categoryId) {
  activeCategory = categoryId;

  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === categoryId);
  });

  await loadLeaderboard(categoryId);
}

async function initLeaderboard() {
  try {
    // Load categories for filter tabs
    const catData = await api.getCategories();
    categories = catData.data;

    const tabsEl = document.getElementById('filter-tabs');
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-tab';
      btn.dataset.category = cat._id;
      btn.innerHTML = `${cat.icon} ${cat.name.split(' ')[0]}`;
      btn.onclick = () => filterLeaderboard(cat._id);
      tabsEl.appendChild(btn);
    });
  } catch (err) {
    // Categories failed — still load global leaderboard
  }

  await loadLeaderboard('');
}

initLeaderboard();
