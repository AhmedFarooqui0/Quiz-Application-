require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

// Ensure DB is connected before handling any request — MUST come before routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/scores', require('./routes/scores'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Catch-all: serve frontend for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  });
}

module.exports = app;