// quiz.js — Quiz Engine
let state = {
  questions: [],
  category: null,
  currentIndex: 0,
  score: 0,
  answered: false,
  timer: null,
  timeLeft: 30,
  maxTime: 30,
  userAnswers: [],
};

const CIRCUMFERENCE = 2 * Math.PI * 30; // ~188.5 for r=30

// Toast helper
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

// Start timer
function startTimer() {
  clearInterval(state.timer);
  state.timeLeft = state.maxTime;
  updateTimerUI();

  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();

    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      if (!state.answered) {
        timeOut();
      }
    }
  }, 1000);
}

// Update timer ring and number
function updateTimerUI() {
  const ring = document.getElementById('timer-ring');
  const num = document.getElementById('timer-number');
  const ratio = state.timeLeft / state.maxTime;
  const offset = CIRCUMFERENCE * (1 - ratio);

  ring.style.strokeDashoffset = offset;
  num.textContent = state.timeLeft;

  const pct = (state.timeLeft / state.maxTime) * 100;
  if (pct <= 25) {
    ring.classList.add('danger'); ring.classList.remove('warning');
    num.classList.add('danger'); num.classList.remove('warning');
  } else if (pct <= 50) {
    ring.classList.add('warning'); ring.classList.remove('danger');
    num.classList.add('warning'); num.classList.remove('danger');
  } else {
    ring.classList.remove('warning', 'danger');
    num.classList.remove('warning', 'danger');
  }
}

// Handle time out — auto-advance as wrong
async function timeOut() {
  state.answered = true;
  showToast('⏰ Time\'s up!', 'info');

  const q = state.questions[state.currentIndex];

  try {
    const result = await api.checkAnswer(q._id, null);
    state.userAnswers.push({
      question: q,
      userAnswer: null,
      correct: false,
      correctLabel: result.correctLabel,
      explanation: result.explanation,
      reference: result.reference,
    });

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.label === result.correctLabel) btn.classList.add('correct');
    });

    showExplanationFromResult(result);
  } catch (err) {
    showToast('Error checking answer', 'error');
  }

  showNavigationButton();
}

// Render current question
function renderQuestion() {
  const q = state.questions[state.currentIndex];
  const total = state.questions.length;
  state.answered = false;

  // Progress
  const progress = ((state.currentIndex) / total) * 100;
  document.getElementById('progress-fill').style.width = `${progress}%`;
  document.getElementById('progress-text').textContent = `Question ${state.currentIndex + 1} of ${total}`;
  document.getElementById('question-number').textContent = `Question ${state.currentIndex + 1}`;
  document.getElementById('live-total').textContent = total;
  document.getElementById('live-score').textContent = state.score;

  // Question text
  document.getElementById('question-text').textContent = q.question;

  // Animate card re-render
  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  card.offsetHeight; // reflow
  card.style.animation = '';

  // Render options
  const grid = document.getElementById('options-grid');
  grid.innerHTML = q.options.map(opt => `
    <button class="option-btn" data-label="${opt.label}" onclick="selectAnswer('${opt.label}')">
      <span class="option-label">${opt.label}</span>
      <span class="option-text">${opt.text}</span>
    </button>
  `).join('');

  // Reset explanation and buttons
  const expPanel = document.getElementById('explanation-panel');
  expPanel.classList.remove('visible');
  document.getElementById('next-btn').style.display = 'none';
  document.getElementById('finish-btn').style.display = 'none';

  // Start timer
  state.maxTime = state.category?.timePerQuestion || 30;
  startTimer();
}

// Handle answer selection
async function selectAnswer(label) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(state.timer);

  const q = state.questions[state.currentIndex];

  try {
    const result = await api.checkAnswer(q._id, label);
    const isCorrect = result.isCorrect;

    if (isCorrect) {
      state.score++;
      document.getElementById('live-score').textContent = state.score;
    }

    state.userAnswers.push({
      question: q,
      userAnswer: label,
      correct: isCorrect,
      correctLabel: result.correctLabel,
      explanation: result.explanation,
      reference: result.reference,
    });

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
      btn.classList.remove('correct', 'wrong');
      if (btn.dataset.label === result.correctLabel) {
        btn.classList.add('correct');
      } else if (btn.dataset.label === label && !isCorrect) {
        btn.classList.add('wrong');
      }
    });

    showExplanationFromResult(result);
    showNavigationButton();
  } catch (err) {
    state.answered = false;
    showToast('Error checking answer, try again', 'error');
  }
}

// Show explanation panel (from server check result, not q.explanation directly anymore)
function showExplanationFromResult(result) {
  const panel = document.getElementById('explanation-panel');
  document.getElementById('explanation-text').textContent = result.explanation;
  const refEl = document.getElementById('explanation-ref');
  if (result.reference) {
    refEl.textContent = `📚 Reference: ${result.reference}`;
    refEl.style.display = 'block';
  } else {
    refEl.style.display = 'none';
  }
  panel.classList.add('visible');
}

// Show next or finish button
function showNavigationButton() {
  const isLast = state.currentIndex === state.questions.length - 1;
  if (isLast) {
    document.getElementById('finish-btn').style.display = 'inline-flex';
  } else {
    document.getElementById('next-btn').style.display = 'inline-flex';
  }
}

// Move to next question
function nextQuestion() {
  state.currentIndex++;
  renderQuestion();
}

// Finish quiz — save to sessionStorage and go to results
function finishQuiz() {
  clearInterval(state.timer);

  sessionStorage.setItem('quiz_results', JSON.stringify({
    score: state.score,
    total: state.questions.length,
    categoryId: state.category._id,
    categoryName: state.category.name,
    categorySlug: state.category.slug,
    categoryIcon: state.category.icon,
    userAnswers: state.userAnswers.map(a => ({
      questionId: a.question._id,
      questionText: a.question.question,
      options: a.question.options,
      correct: a.correctLabel,
      userAnswer: a.userAnswer,
      wasCorrect: a.correct,
      explanation: a.explanation,
      reference: a.reference || '',
    })),
  }));

  window.location.href = 'results.html';
}
// Init quiz
async function initQuiz() {
  // Login is required to take a quiz.
  if (!Auth.requireLogin('quiz')) return;

  const slug = sessionStorage.getItem('quiz_slug');
  const catId = sessionStorage.getItem('quiz_cat_id');

  if (!slug || !catId) {
    window.location.href = 'index.html';
    return;
  }

  const loading = document.getElementById('quiz-loading');
  const errorEl = document.getElementById('quiz-error');
  const content = document.getElementById('quiz-content');

  try {
    const data = await api.getQuestions(slug, 10);
    state.category = data.category;
    state.questions = data.data;
    state.maxTime = state.category.timePerQuestion || 30;

    if (!state.questions.length) {
      throw new Error('No questions found for this category.');
    }

    // Update header
    document.getElementById('cat-icon').textContent = state.category.icon;
    document.getElementById('cat-name').textContent = state.category.name;
    document.getElementById('cat-subtitle').textContent = `${state.questions.length} Questions`;
    document.title = `${state.category.name} — DevQuiz`;

    loading.style.display = 'none';
    content.style.display = 'block';

    renderQuestion();
  } catch (err) {
    if (err.status === 401) {
      Auth.requireLogin('quiz');
      return;
    }
    loading.style.display = 'none';
    errorEl.style.display = 'block';
    document.getElementById('quiz-error-msg').textContent = err.message;
  }
}

initQuiz();
