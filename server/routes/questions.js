const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Category = require('../models/Category');
const { requireAuth } = require('../middleware/auth');

// GET /api/questions/:categorySlug?difficulty=medium&limit=10
// Login is required to take a quiz.
router.get('/:categorySlug', requireAuth, async (req, res) => {
  try {
    const { difficulty, limit = 10 } = req.query;
    const { categorySlug } = req.params;

    // Find category by slug
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Build filter
    const filter = { categoryId: category._id };
    if (difficulty) filter.difficulty = difficulty;

    // Get all matching questions, then randomly pick `limit` of them
    const allQuestions = await Question.find(filter).select('-__v');
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, parseInt(limit));

    res.json({
      success: true,
      category: category,
      total: allQuestions.length,
      count: selected.length,
      data: selected,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
