const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    timePerQuestion: { type: Number, default: 30 }, // seconds
    color: { type: String, default: '#4f8ef7' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
