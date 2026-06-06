const rateLimit = require('express-rate-limit');

// Throttle authentication attempts to blunt brute-force and credential-stuffing.
// The window is deliberately generous so it never gets in a real user's way.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts from this IP, please try again later.' },
});

module.exports = { authLimiter };
