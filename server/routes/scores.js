const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const Category = require('../models/Category');

// POST /api/scores — Submit a score
router.post('/', async (req, res) => {
  try {
    const { playerName, categoryId, score, total, timeTaken } = req.body;

    if (!playerName || !categoryId || score === undefined || !total) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    const newScore = await Score.create({
      playerName: playerName.trim(),
      categoryId,
      categoryName: category.name,
      score,
      total,
      percentage,
      timeTaken: timeTaken || 0,
      passed,
    });

    res.status(201).json({ success: true, data: newScore, passed });
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
