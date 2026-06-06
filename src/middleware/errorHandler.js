const config = require('../config');

/**
 * Central error handler. Express only treats this as an error handler because it
 * declares four arguments, so `next` has to stay in the signature.
 *
 * The status code is taken from whatever the error advertises: our own ApiError
 * sets `statusCode`, and framework errors set one too (e.g. body-parser throws a
 * 400 on a malformed JSON body). Anything without one is treated as a 500.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  // Server-side faults are unexpected, so log the full stack for debugging.
  if (statusCode >= 500) {
    console.error(err);
  }

  let message;
  if (statusCode >= 500) {
    message = 'Internal server error';
  } else if (err.type === 'entity.parse.failed') {
    message = 'Invalid JSON in request body';
  } else {
    message = err.message;
  }

  const body = { error: message };
  if (err.details) {
    body.details = err.details;
  }

  // Surface the real message and stack on 500s while developing.
  if (config.env === 'development' && statusCode >= 500) {
    body.error = err.message;
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
