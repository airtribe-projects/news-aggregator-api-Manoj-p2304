// Catches any request that didn't match a route and returns a clean 404.
function notFound(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFound;
