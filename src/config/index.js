require('dotenv').config();

function int(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 3000),

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-secret-change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  bcrypt: {
    saltRounds: int(process.env.BCRYPT_SALT_ROUNDS, 10),
  },

  // Defaults target NewsAPI (https://newsapi.org). Point NEWS_API_URL at a
  // different provider if you swap it out.
  news: {
    apiKey: process.env.NEWS_API_KEY || '',
    baseUrl: process.env.NEWS_API_URL || 'https://newsapi.org/v2',
    pageSize: int(process.env.NEWS_PAGE_SIZE, 20),
    cacheTtlMs: int(process.env.NEWS_CACHE_TTL_SECONDS, 300) * 1000,
  },
};

// Never run on the baked-in dev secret in production — fail fast so a
// misconfigured deployment can't silently accept forged tokens.
if (
  config.env === 'production' &&
  (!process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'dev-only-secret-change-me-in-production')
) {
  throw new Error('JWT_SECRET must be set to a strong, random value in production.');
}

module.exports = config;
