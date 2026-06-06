const ApiError = require('../utils/ApiError');
const token = require('../utils/token');
const userModel = require('../models/userModel');

/**
 * Verifies the `Authorization: Bearer <token>` header, loads the matching user
 * and attaches it to `req.user`. Any failure results in a 401.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, value] = header.split(' ');

  if (scheme !== 'Bearer' || !value) {
    return next(new ApiError(401, 'Authentication required. Provide a Bearer token.'));
  }

  try {
    const payload = token.verify(value);
    const user = userModel.findById(payload.sub);

    if (!user) {
      return next(new ApiError(401, 'Invalid token: the user no longer exists.'));
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token.'));
  }
}

module.exports = authenticate;
