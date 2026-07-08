const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const Category = require('../models/Category');
<<<<<<< HEAD
const { requireAuth } = require('../middleware/auth');

// POST /api/scores — Submit a score (must be logged in)
// playerName is taken from the authenticated user, never trusted from the body.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { categoryId, score, total, timeTaken } = req.body;

    if (!categoryId || score === undefined || !total) {
=======

// POST /api/scores — Submit a score
router.post('/', async (req, res) => {
  try {
    const { playerName, categoryId, score, total, timeTaken } = req.body;

    if (!playerName || !categoryId || score === undefined || !total) {
>>>>>>> 1c2468e0eb576ccf74ae27231ade5d137b954910
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    const newScore = await Score.create({
<<<<<<< HEAD
      playerName: req.user.name,
      userId: req.user.id,
=======
      playerName: playerName.trim(),
>>>>>>> 1c2468e0eb576ccf74ae27231ade5d137b954910
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
