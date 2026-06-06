/**
 * Error type that carries an HTTP status code. Throwing one of these from
 * anywhere in the request lifecycle lets the central error handler turn it
 * into a proper response instead of a generic 500.
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
