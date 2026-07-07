const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  label: { type: String, required: true }, // "A", "B", "C", "D"
  text: { type: String, required: true },
});

const questionSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    question: { type: String, required: true },
    options: [optionSchema],
    correct: { type: String, required: true }, // "A" | "B" | "C" | "D"
    explanation: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    tags: [{ type: String }],
    reference: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
