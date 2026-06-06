const express = require('express');
const helmet = require('helmet');

const userRoutes = require('./src/routes/userRoutes');
const newsRoutes = require('./src/routes/newsRoutes');
const notFound = require('./src/middleware/notFound');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(helmet()); // sensible security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple liveness probe.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/users', userRoutes);
app.use('/news', newsRoutes);

// 404 + centralized error handling come last.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
