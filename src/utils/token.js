const jwt = require('jsonwebtoken');
const config = require('../config');

function sign(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function verify(token) {
  // Pin the algorithm so a token can't be verified under an unexpected one.
  return jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
}

module.exports = { sign, verify };
