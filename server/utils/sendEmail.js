const nodemailer = require('nodemailer');

// Gmail SMTP transporter.
// Requires EMAIL_USER (your Gmail address) and EMAIL_PASS (a 16-character
// Gmail "App Password" — NOT your normal Gmail password) set in server/.env.
// How to create an App Password: Google Account -> Security -> 2-Step
// Verification (must be ON) -> App passwords -> generate one for "Mail".
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(to, name, verifyUrl) {
  const info = await transporter.sendMail({
    from: `"DevQuiz" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your DevQuiz account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#4f8ef7;">Welcome to DevQuiz, ${name}! 💻</h2>
        <p>Thanks for signing up. Please confirm your email address to activate your account.</p>
        <p style="text-align:center; margin: 32px 0;">
          <a href="${verifyUrl}"
             style="background:#4f8ef7;color:#fff;padding:12px 28px;border-radius:8px;
                    text-decoration:none;font-weight:600;display:inline-block;">
            Verify My Email
          </a>
        </p>
        <p style="color:#666;font-size:0.85rem;">
          Or copy and paste this link into your browser:<br/>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <p style="color:#999;font-size:0.8rem;">This link expires in 24 hours. If you didn't create a DevQuiz account, you can ignore this email.</p>
      </div>
    `,
  });

  return info;
}

async function sendPasswordResetEmail(to, name, resetUrl) {
  const info = await transporter.sendMail({
    from: `"DevQuiz" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your DevQuiz password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#4f8ef7;">Password reset requested</h2>
        <p>Hi ${name}, click below to choose a new password. This link expires in 1 hour.</p>
        <p style="text-align:center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background:#4f8ef7;color:#fff;padding:12px 28px;border-radius:8px;
                    text-decoration:none;font-weight:600;display:inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color:#999;font-size:0.8rem;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return info;
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
