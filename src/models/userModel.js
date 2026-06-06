/**
 * In-memory user store.
 *
 * Everything lives in process memory and is wiped on restart. That keeps the
 * project dependency-free; swapping in a real database later only means
 * reimplementing the functions below.
 */

let sequence = 1;
const usersById = new Map();
const usersByEmail = new Map();

const normalizeEmail = (email) => String(email).trim().toLowerCase();

function createUser({ name, email, passwordHash, preferences = [] }) {
  const user = {
    id: sequence++,
    name: name.trim(),
    email: normalizeEmail(email),
    passwordHash,
    preferences: [...preferences],
    // Article id -> article, populated whenever the user fetches news. Lets the
    // read/favorite endpoints reference articles by id without a database.
    seenArticles: new Map(),
    readArticles: new Map(),
    favoriteArticles: new Map(),
  };

  usersById.set(user.id, user);
  usersByEmail.set(user.email, user);
  return user;
}

function findById(id) {
  return usersById.get(id);
}

function findByEmail(email) {
  return usersByEmail.get(normalizeEmail(email));
}

function updatePreferences(user, preferences) {
  user.preferences = [...preferences];
  return user.preferences;
}

// Mainly useful for tests that need a clean slate.
function reset() {
  usersById.clear();
  usersByEmail.clear();
  sequence = 1;
}

module.exports = {
  createUser,
  findById,
  findByEmail,
  updatePreferences,
  reset,
};
