const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    categoryName: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeTaken: { type: Number, default: 0 }, // seconds
    passed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Score', scoreSchema);
