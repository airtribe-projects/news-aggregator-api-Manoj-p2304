const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const newsService = require('../services/newsService');

// Track which articles a user has been shown so the read/favorite endpoints can
// look them up by id later.
function remember(user, articles) {
  articles.forEach((article) => user.seenArticles.set(article.id, article));
}

function requireSeenArticle(user, id) {
  const article = user.seenArticles.get(id);
  if (!article) {
    throw new ApiError(
      404,
      'Article not found. Fetch it via GET /news or /news/search first.',
    );
  }
  return article;
}

const getNews = asyncHandler(async (req, res) => {
  const articles = await newsService.getNewsForPreferences(req.user.preferences);
  remember(req.user, articles);

  res.status(200).json({ news: articles });
});

const searchNews = asyncHandler(async (req, res) => {
  const { keyword } = req.params;
  if (!keyword || !keyword.trim()) {
    throw new ApiError(400, 'A search keyword is required');
  }

  const articles = await newsService.searchNews(keyword);
  remember(req.user, articles);

  res.status(200).json({ news: articles });
});

const markRead = asyncHandler(async (req, res) => {
  const article = requireSeenArticle(req.user, req.params.id);
  req.user.readArticles.set(article.id, {
    ...article,
    readAt: new Date().toISOString(),
  });

  res.status(200).json({ message: 'Article marked as read', article });
});

const getReadArticles = asyncHandler(async (req, res) => {
  res.status(200).json({ read: [...req.user.readArticles.values()] });
});

const markFavorite = asyncHandler(async (req, res) => {
  const article = requireSeenArticle(req.user, req.params.id);
  req.user.favoriteArticles.set(article.id, {
    ...article,
    favoritedAt: new Date().toISOString(),
  });

  res.status(200).json({ message: 'Article added to favorites', article });
});

const getFavoriteArticles = asyncHandler(async (req, res) => {
  res.status(200).json({ favorites: [...req.user.favoriteArticles.values()] });
});

module.exports = {
  getNews,
  searchNews,
  markRead,
  getReadArticles,
  markFavorite,
  getFavoriteArticles,
};
