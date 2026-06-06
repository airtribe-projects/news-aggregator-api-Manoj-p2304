const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/userModel');
const password = require('../utils/password');
const token = require('../utils/token');
const {
  validateSignup,
  validateLogin,
  validatePreferences,
} = require('../utils/validators');

// Shape a user record into something safe to send back (no password hash).
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  preferences: user.preferences,
});

const signup = asyncHandler(async (req, res) => {
  const errors = validateSignup(req.body);
  if (errors.length) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  const { name, email, password: rawPassword, preferences } = req.body;

  if (userModel.findByEmail(email)) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await password.hash(rawPassword);
  const user = userModel.createUser({ name, email, passwordHash, preferences });

  res.status(200).json({
    message: 'Signup successful',
    user: publicUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const errors = validateLogin(req.body);
  if (errors.length) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  const { email, password: rawPassword } = req.body;
  const user = userModel.findByEmail(email);

  // Use the same error for "unknown email" and "wrong password" so we don't
  // leak which emails are registered.
  const credentialsValid =
    user && (await password.compare(rawPassword, user.passwordHash));

  if (!credentialsValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Keep the payload minimal — authenticate() resolves the rest from the id.
  const authToken = token.sign({ sub: user.id });

  res.status(200).json({
    message: 'Login successful',
    token: authToken,
  });
});

const getPreferences = asyncHandler(async (req, res) => {
  res.status(200).json({ preferences: req.user.preferences });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const errors = validatePreferences(req.body);
  if (errors.length) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  const preferences = userModel.updatePreferences(req.user, req.body.preferences);

  res.status(200).json({
    message: 'Preferences updated',
    preferences,
  });
});

module.exports = { signup, login, getPreferences, updatePreferences };
