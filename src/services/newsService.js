const { createHash } = require('crypto');
const axios = require('axios');
const config = require('../config');
const TtlCache = require('../utils/cache');

// One shared cache for the whole process. Keyed by the normalized query string
// so two users with the same preferences reuse a single upstream call.
const cache = new TtlCache();

// Stable short id derived from the article URL. Gives us something to reference
// from the read/favorite endpoints since the provider doesn't return ids.
function articleId(url) {
  return createHash('sha1').update(url || '').digest('hex').slice(0, 12);
}

function normalizeArticle(raw) {
  return {
    id: articleId(raw.url),
    title: raw.title,
    description: raw.description,
    content: raw.content,
    url: raw.url,
    imageUrl: raw.urlToImage || null,
    source: raw.source && raw.source.name ? raw.source.name : null,
    author: raw.author || null,
    publishedAt: raw.publishedAt || null,
  };
}

// NewsAPI's /everything endpoint expects a keyword query, so join the user's
// preferences with OR and let any of them match.
function buildQuery(preferences) {
  const terms = (preferences || [])
    .map((term) => term.trim())
    .filter(Boolean);

  return terms.length ? terms.join(' OR ') : 'top news';
}

async function callProvider(query) {
  if (!config.news.apiKey) {
    // No key configured (this is the case in CI / the automated tests). Degrade
    // gracefully so the endpoint still responds instead of erroring out.
    console.warn('[newsService] NEWS_API_KEY is not set — returning an empty result set.');
    return [];
  }

  const { data } = await axios.get(`${config.news.baseUrl}/everything`, {
    params: {
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: config.news.pageSize,
    },
    headers: { 'X-Api-Key': config.news.apiKey },
    timeout: 8000,
  });

  return (data.articles || []).map(normalizeArticle);
}

async function fetchCached(cacheKey, query) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const articles = await callProvider(query);
    cache.set(cacheKey, articles, config.news.cacheTtlMs);
    return articles;
  } catch (err) {
    // A flaky upstream shouldn't bring our API down. Log it and hand back an
    // empty list; we deliberately don't cache failures so the next call retries.
    const reason = err.response
      ? `${err.response.status} ${err.response.statusText}`
      : err.message;
    console.error(`[newsService] Upstream request failed (${reason}).`);
    return [];
  }
}

function getNewsForPreferences(preferences) {
  const query = buildQuery(preferences);
  return fetchCached(`prefs:${query.toLowerCase()}`, query);
}

function searchNews(keyword) {
  const query = String(keyword || '').trim();
  if (!query) return Promise.resolve([]);
  return fetchCached(`search:${query.toLowerCase()}`, query);
}

module.exports = { getNewsForPreferences, searchNews, articleId };
