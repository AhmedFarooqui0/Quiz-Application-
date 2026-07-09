const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Category = require('../models/Category');
const { requireAuth } = require('../middleware/auth');

// Fisher-Yates shuffle helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const LABELS = ['A', 'B', 'C', 'D'];

// Shuffles options AND re-assigns fresh labels (A,B,C,D) based on new position
function shuffleQuestionOptions(question) {
  const questionObj = question.toObject();

  const correctOption = questionObj.options.find(
    (opt) => opt.label === questionObj.correct
  );

  const shuffledOptions = shuffleArray(questionObj.options);

  let newCorrectLabel = questionObj.correct;
  const relabeledOptions = shuffledOptions.map((opt, index) => {
    const newLabel = LABELS[index];
    if (opt.text === correctOption.text) {
      newCorrectLabel = newLabel;
    }
    return { ...opt, label: newLabel };
  });

  questionObj.options = relabeledOptions;
  questionObj.correct = newCorrectLabel;

  return questionObj;
}

router.get('/:categorySlug', requireAuth, async (req, res) => {
  try {
    const { difficulty, limit = 10 } = req.query;
    const { categorySlug } = req.params;

    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const filter = { categoryId: category._id };
    if (difficulty) filter.difficulty = difficulty;

    const allQuestions = await Question.find(filter).select('-__v');
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, parseInt(limit));

    // 👇 THIS is the line — replaces your old .map(q => q.toObject()) or similar
    const selectedWithShuffledOptions = selected.map((q) => shuffleQuestionOptions(q));

    res.json({
      success: true,
      category: category,
      total: allQuestions.length,
      count: selectedWithShuffledOptions.length,
      data: selectedWithShuffledOptions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;