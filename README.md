# News Aggregator API

A RESTful API for a personalized news aggregator, built with Node.js and Express.
Users can register, log in, manage their topic preferences, and fetch news
articles tailored to those preferences from an external news provider.

This is Assignment 2 of the Airtribe Backend Engineering Launchpad.

## Features

- **Authentication** — signup and login with passwords hashed using `bcrypt`.
- **Token-based security** — protected routes are guarded by JWT (`jsonwebtoken`).
- **User preferences** — read and update the news topics a user cares about.
- **News integration** — fetches articles from an external provider (NewsAPI by
  default) based on the logged-in user's preferences.
- **Caching** — upstream responses are cached in memory with a TTL to stay
  within the free-tier rate limits of the news provider.
- **Bonus endpoints** — keyword search, mark articles as read, and favorites.
- **Robust errors & validation** — every input is validated and all errors are
  funnelled through a single error handler that returns consistent JSON.
- **Hardening** — `helmet` security headers plus rate limiting on the auth routes.

## Tech stack

Node.js · Express · bcrypt · jsonwebtoken · axios · helmet · express-rate-limit ·
dotenv · tap + supertest (tests)

## Project structure

```
.
├── app.js                      # Builds and exports the Express app (no listen)
├── index.js                    # Server bootstrap — starts listening
├── src
│   ├── config/                 # Environment-driven configuration
│   ├── controllers/            # Request handlers (users, news)
│   ├── middleware/             # auth, 404, central error handler
│   ├── models/                 # In-memory user store
│   ├── routes/                 # Route definitions
│   ├── services/               # External news API + caching
│   └── utils/                  # ApiError, asyncHandler, cache, password, token, validators
└── test/                       # Provided tap/supertest suite
```

`app.js` is intentionally separate from `index.js` so the test suite can import
the configured app without opening a network port.

## Getting started

### Prerequisites

- Node.js **v18+** (developed on v22)

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

| Variable                 | Default                     | Description                                            |
| ------------------------ | --------------------------- | ------------------------------------------------------ |
| `PORT`                   | `3000`                      | Port the server listens on.                            |
| `NODE_ENV`               | `development`               | `development` exposes stack traces on 500s.            |
| `JWT_SECRET`             | dev fallback                | Secret used to sign JWTs. **Set this in production.**  |
| `JWT_EXPIRES_IN`         | `1h`                        | Token lifetime.                                        |
| `BCRYPT_SALT_ROUNDS`     | `10`                        | bcrypt cost factor.                                    |
| `NEWS_API_KEY`           | _(empty)_                   | API key for the news provider. See note below.         |
| `NEWS_API_URL`           | `https://newsapi.org/v2`    | Base URL of the news provider.                         |
| `NEWS_PAGE_SIZE`         | `20`                        | Number of articles requested per fetch.                |
| `NEWS_CACHE_TTL_SECONDS` | `300`                       | How long upstream responses are cached.                |

> **Note on the API key:** Sign up at [newsapi.org](https://newsapi.org) (or any
> compatible provider) for a free key. If `NEWS_API_KEY` is left empty the
> `/news` endpoints still respond with `200` and an empty `news` array, so the
> automated tests pass without any external dependency.

### Running

```bash
npm start      # production-style start
npm run dev    # auto-reload with nodemon
```

The server logs the port and active environment, e.g.
`News Aggregator API is running on port 3000 (development)`.

## API reference

All request and response bodies are JSON. Protected routes require an
`Authorization: Bearer <token>` header. A `GET /health` endpoint (no auth)
returns `{ "status": "ok" }` for liveness checks.

### Auth

| Method | Endpoint         | Auth | Description                  |
| ------ | ---------------- | ---- | ---------------------------- |
| POST   | `/users/signup`  | No   | Register a new user.         |
| POST   | `/users/login`   | No   | Log in and receive a token.  |

**POST `/users/signup`**

```json
{
  "name": "Clark Kent",
  "email": "clark@superman.com",
  "password": "Krypt()n8",
  "preferences": ["movies", "comics"]
}
```

Returns `200` with `{ "message": "Signup successful", "user": { id, name, email,
preferences } }` — never the password. `400` if validation fails, `409` if the
email is already registered.

**POST `/users/login`**

```json
{ "email": "clark@superman.com", "password": "Krypt()n8" }
```

Returns `200` with `{ "message": "Login successful", "token": "<jwt>" }`.
`401` on invalid credentials.

### Preferences

| Method | Endpoint              | Auth | Description               |
| ------ | --------------------- | ---- | ------------------------- |
| GET    | `/users/preferences`  | Yes  | Get the user's topics.    |
| PUT    | `/users/preferences`  | Yes  | Replace the user's topics. |

**PUT `/users/preferences`**

```json
{ "preferences": ["movies", "comics", "games"] }
```

### News

| Method | Endpoint                 | Auth | Description                                  |
| ------ | ------------------------ | ---- | -------------------------------------------- |
| GET    | `/news`                  | Yes  | Articles matching the user's preferences.    |
| GET    | `/news/search/:keyword`  | Yes  | Search articles by keyword.                  |
| POST   | `/news/:id/read`         | Yes  | Mark an article as read.                     |
| GET    | `/news/read`             | Yes  | List articles the user has read.             |
| POST   | `/news/:id/favorite`     | Yes  | Add an article to favorites.                 |
| GET    | `/news/favorites`        | Yes  | List the user's favorite articles.           |

Article ids returned by `GET /news` / `GET /news/search/:keyword` are the ids you
pass to the read / favorite endpoints.

### Example

```bash
# 1. Sign up
curl -X POST http://localhost:3000/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Clark Kent","email":"clark@superman.com","password":"Krypt()n8","preferences":["movies","comics"]}'

# 2. Log in and capture the token
TOKEN=$(curl -s -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"clark@superman.com","password":"Krypt()n8"}' | jq -r .token)

# 3. Fetch personalized news
curl http://localhost:3000/news -H "Authorization: Bearer $TOKEN"
```

## Running the tests

```bash
npm run test
```

The suite (tap + supertest) exercises signup, login, preferences, and the news
endpoint, including auth-failure cases. All tests pass out of the box without a
news API key.

## Implementation notes

- **Storage is in-memory.** Users and their reading history live in process
  memory and reset on restart. The data layer is isolated in `src/models`, so
  swapping in a real database only touches that module.
- **Graceful degradation.** If the news provider is unreachable or no key is
  configured, the API logs a warning and returns an empty result set rather than
  failing the request.
- **Security.** Passwords are never stored or returned in plain text, login
  responses don't reveal whether an email exists, and all protected routes
  verify the JWT before doing any work. Responses carry `helmet` security
  headers, JWT verification is pinned to a single algorithm, and the auth routes
  are rate-limited. In production the app refuses to start on the default
  development secret.
