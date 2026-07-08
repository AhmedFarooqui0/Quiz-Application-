const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/sendEmail');
const { isValidEmail, validatePassword, validateName } = require('../utils/validators');

const CLIENT_URL = process.env.CLIENT_URL || 'https://quiz-application-topaz-seven.vercel.app/';
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function signToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const nameError = validateName(name);
    if (nameError) return res.status(400).json({ success: false, message: nameError });

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationTokenExpires: Date.now() + VERIFY_TOKEN_TTL_MS,
    });

    const verifyUrl = `${CLIENT_URL}/api/auth/verify/${verificationToken}`;

    try {
      await sendVerificationEmail(user.email, user.name, verifyUrl);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
      // The account was created; let the user know email delivery failed
      // rather than silently pretending it worked.
      return res.status(201).json({
        success: true,
        message:
          'Account created, but the verification email could not be sent. Please try "Resend verification email" from the login page.',
      });
    }

    res.status(201).json({
      success: true,
      message: `Account created! We sent a verification link to ${user.email}. Please check your inbox (and spam folder).`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// GET /api/auth/verify/:token — clicked from the email
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
    }).select('+verificationToken +verificationTokenExpires');

    if (!user) {
      return res.redirect(`/login.html?verified=error&reason=invalid`);
    }

    if (user.verificationTokenExpires < Date.now()) {
      return res.redirect(`/login.html?verified=error&reason=expired`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.redirect(`/login.html?verified=success`);
  } catch (err) {
    console.error(err);
    return res.redirect(`/login.html?verified=error&reason=server`);
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Don't reveal whether the account exists.
    const genericMessage = 'If an account with that email exists, a verification link has been sent.';

    if (!user || user.isVerified) {
      return res.json({ success: true, message: genericMessage });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + VERIFY_TOKEN_TTL_MS;
    await user.save();

    const verifyUrl = `${CLIENT_URL}/api/auth/verify/${verificationToken}`;
    await sendVerificationEmail(user.email, user.name, verifyUrl);

    res.json({ success: true, message: genericMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email and password' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: 'NOT_VERIFIED',
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
      });
    }

    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// GET /api/auth/me — returns the current logged-in user (validates token)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
});

module.exports = router;
