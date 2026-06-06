const app = require('./app');
const config = require('./src/config');

const server = app.listen(config.port, () => {
  console.log(`News Aggregator API is running on port ${config.port} (${config.env})`);
});

// Shut down cleanly so nodemon restarts and container stops don't leak the port.
function shutdown(signal) {
  console.log(`\n${signal} received — closing server.`);
  server.close(() => process.exit(0));
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

module.exports = server;
