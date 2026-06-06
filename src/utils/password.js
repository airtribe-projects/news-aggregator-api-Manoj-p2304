const bcrypt = require('bcrypt');
const config = require('../config');

function hash(plainText) {
  return bcrypt.hash(plainText, config.bcrypt.saltRounds);
}

function compare(plainText, hashed) {
  return bcrypt.compare(plainText, hashed);
}

module.exports = { hash, compare };
