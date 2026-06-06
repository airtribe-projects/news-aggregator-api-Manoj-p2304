const { Router } = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

// Public (rate-limited to slow down brute-force attempts)
router.post('/signup', authLimiter, userController.signup);
router.post('/login', authLimiter, userController.login);

// Protected
router.get('/preferences', authenticate, userController.getPreferences);
router.put('/preferences', authenticate, userController.updatePreferences);

module.exports = router;
