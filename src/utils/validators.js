// Lightweight, dependency-free request validation. Each validator returns an
// array of human-readable error strings; an empty array means "all good".

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
// bcrypt silently ignores everything past 72 bytes, so reject longer passwords
// rather than letting two different inputs hash to the same value.
const MAX_PASSWORD_BYTES = 72;

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

function validateSignup(body = {}) {
  const errors = [];
  const { name, email, password, preferences } = body;

  if (!isNonEmptyString(name)) {
    errors.push('name is required');
  }

  if (!isNonEmptyString(email)) {
    errors.push('email is required');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('email must be a valid email address');
  }

  if (!isNonEmptyString(password)) {
    errors.push('password is required');
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  } else if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    errors.push(`password must be at most ${MAX_PASSWORD_BYTES} bytes long`);
  }

  // preferences are optional on signup, but if present they must be string[]
  if (preferences !== undefined && !isStringArray(preferences)) {
    errors.push('preferences must be an array of strings');
  }

  return errors;
}

function validateLogin(body = {}) {
  const errors = [];
  const { email, password } = body;

  if (!isNonEmptyString(email)) {
    errors.push('email is required');
  }
  if (!isNonEmptyString(password)) {
    errors.push('password is required');
  }

  return errors;
}

function validatePreferences(body = {}) {
  const errors = [];

  if (!isStringArray(body.preferences)) {
    errors.push('preferences must be an array of strings');
  }

  return errors;
}

module.exports = { validateSignup, validateLogin, validatePreferences };
