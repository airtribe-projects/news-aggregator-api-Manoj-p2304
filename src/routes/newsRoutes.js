const { Router } = require('express');
const newsController = require('../controllers/newsController');
const authenticate = require('../middleware/authenticate');

const router = Router();

// Every news route requires a valid token.
router.use(authenticate);

router.get('/', newsController.getNews);
router.get('/search/:keyword', newsController.searchNews);

// Reading history
router.get('/read', newsController.getReadArticles);
router.post('/:id/read', newsController.markRead);

// Favorites
router.get('/favorites', newsController.getFavoriteArticles);
router.post('/:id/favorite', newsController.markFavorite);

module.exports = router;
