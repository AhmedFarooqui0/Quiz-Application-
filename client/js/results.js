// results.js — Results Page Logic
const RING_CIRCUMFERENCE = 2 * Math.PI * 75; // ~471 for r=75

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3500);
}

let resultsData = null;

function initResults() {
  const raw = sessionStorage.getItem('quiz_results');
  if (!raw) {
    document.getElementById('no-results').style.display = 'block';
    return;
  }

  resultsData = JSON.parse(raw);
  const { score, total, categoryName, categoryIcon, userAnswers } = resultsData;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 70;
  const wrong = total - score;

  // Show content
  document.getElementById('results-content').style.display = 'block';
  document.title = `Results — ${categoryName} | DevQuiz`;

  // Category
  document.getElementById('result-category-name').textContent = `${categoryIcon || '💻'} ${categoryName}`;

  // Score ring animate
  const ring = document.getElementById('score-ring');
  ring.classList.add(passed ? 'pass' : 'fail');
  const offset = RING_CIRCUMFERENCE * (1 - percentage / 100);
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);

  // Percentage counter animation
  const pctEl = document.getElementById('score-pct');
  let counter = 0;
  const target = percentage;
  const step = Math.max(1, Math.floor(target / 60));
  const interval = setInterval(() => {
    counter = Math.min(counter + step, target);
    pctEl.textContent = `${counter}%`;
    if (counter >= target) clearInterval(interval);
  }, 25);

  // Stats
  document.getElementById('stat-correct').textContent = score;
  document.getElementById('stat-wrong').textContent = wrong;
  document.getElementById('stat-total').textContent = total;

  // Pass/Fail banner
  const banner = document.getElementById('result-banner');
  banner.classList.add(passed ? 'pass' : 'fail');
  document.getElementById('banner-icon').textContent = passed ? '🎉' : '💪';
  document.getElementById('banner-title').textContent = passed
    ? (percentage >= 90 ? 'Outstanding!' : percentage >= 80 ? 'Great Job!' : 'You Passed!')
    : 'Keep Practicing!';
  document.getElementById('banner-sub').textContent = passed
    ? `You scored ${percentage}% and passed with ${score}/${total} correct answers.`
    : `You scored ${percentage}%. You need 70% to pass. Review the explanations below and try again!`;

  // Review list
  renderReview(userAnswers);
}

function renderReview(answers) {
  const list = document.getElementById('review-list');
  list.innerHTML = answers.map((a, i) => {
    const isCorrect = a.wasCorrect;
    const correctOption = a.options.find(o => o.label === a.correct);
    const userOption = a.userAnswer ? a.options.find(o => o.label === a.userAnswer) : null;

    return `
      <div class="review-item ${isCorrect ? 'correct-item' : 'wrong-item'}" id="review-${i}">
        <div class="review-item-header" onclick="toggleReview(${i})">
          <div class="review-status-dot"></div>
          <div class="review-q-text">${i + 1}. ${a.questionText}</div>
          <div class="review-chevron">▼</div>
        </div>
        <div class="review-item-body">
          ${!isCorrect ? `
            <div class="review-answer-row">
              <span class="answer-indicator your-answer">Your answer</span>
              <span>${userOption ? userOption.text : '⏰ Timed out'}</span>
            </div>
          ` : ''}
          <div class="review-answer-row">
            <span class="answer-indicator correct-answer">Correct</span>
            <span class="right-answer-highlight">${correctOption ? correctOption.text : a.correct}</span>
          </div>
          <div class="review-explanation">${a.explanation}</div>
          ${a.reference ? `<div class="explanation-reference" style="margin-top:8px;">📚 ${a.reference}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function toggleReview(i) {
  const item = document.getElementById(`review-${i}`);
  item.classList.toggle('open');
}

async function submitScore() {
  const nameInput = document.getElementById('player-name-input');
  const name = nameInput.value.trim();
  if (!name) {
    showToast('Please enter your name first!', 'error');
    nameInput.focus();
    return;
  }

  const btn = document.getElementById('submit-score-btn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const { score, total, categoryId } = resultsData;
    await api.submitScore({ playerName: name, categoryId, score, total });

    document.getElementById('submit-form').innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:2rem;margin-bottom:12px;">✅</div>
        <div style="font-weight:700;margin-bottom:6px;">Score submitted!</div>
        <div style="color:var(--text-secondary);font-size:0.9rem;">Check the leaderboard to see your rank.</div>
        <a href="leaderboard.html" class="btn btn-primary" style="margin-top:16px;">View Leaderboard</a>
      </div>
    `;
    showToast('Score submitted to leaderboard!', 'success');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Submit to Leaderboard';
    showToast(err.message || 'Failed to submit score', 'error');
  }
}

function retryQuiz() {
  if (resultsData) {
    sessionStorage.setItem('quiz_slug', resultsData.categorySlug);
    sessionStorage.setItem('quiz_cat_id', resultsData.categoryId);
    window.location.href = 'quiz.html';
  } else {
    window.location.href = 'index.html';
  }
}

initResults();
