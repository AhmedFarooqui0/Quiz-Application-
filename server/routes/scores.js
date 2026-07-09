const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const Category = require('../models/Category');
const Question = require('../models/Question');
const { requireAuth } = require('../middleware/auth');

// POST /api/scores — Submit quiz answers (must be logged in)
// Server verifies every answer against the DB and computes the score itself.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { categoryId, answers, timeTaken } = req.body;
    // answers = [{ questionId: "...", selectedLabel: "B" }, ...]

    if (!categoryId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    let score = 0;
    const results = [];

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (!question) continue;

      const isCorrect = question.correct === answer.selectedLabel;
      if (isCorrect) score++;

      results.push({
        questionId: question._id,
        selectedLabel: answer.selectedLabel,
        correctLabel: question.correct,
        isCorrect,
        explanation: question.explanation,
      });
    }

    const total = answers.length;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    const newScore = await Score.create({
      playerName: req.user.name,
      userId: req.user.id,
      categoryId,
      categoryName: category.name,
      score,
      total,
      percentage,
      timeTaken: timeTaken || 0,
      passed,
    });

    res.status(201).json({ success: true, data: newScore, passed, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/scores/leaderboard — Global top 10
router.get('/leaderboard', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { categoryId } : {};
    const scores = await Score.find(filter)
      .sort({ percentage: -1, timeTaken: 1 })
      .limit(10)
      .select('playerName categoryName score total percentage timeTaken createdAt');
    res.json({ success: true, data: scores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/scores/leaderboard/:categoryId — Category-specific top 10
router.get('/leaderboard/:categoryId', async (req, res) => {
  try {
    const scores = await Score.find({ categoryId: req.params.categoryId })
      .sort({ percentage: -1, timeTaken: 1 })
      .limit(10)
      .select('playerName categoryName score total percentage timeTaken createdAt');
    res.json({ success: true, data: scores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;