```markdown
# 🚀 LinkBox — Setup Guide

## Prerequisites
- Node.js >= 18
- npm or yarn

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/B2-st/linkbox.git
cd linkbox

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env and set a strong JWT_SECRET

# 4. Run database migrations
npm run migrate

# 5. Start the server
npm run dev    # development (with hot-reload)
npm start      # production
```

## Docker

```bash
# Build and run
docker build -t linkbox .
docker run -p 3000:3000 -v linkbox-data:/app/data linkbox
```

## Deploy on Railway / Render

1. Connect your GitHub repo
2. Set environment variables:
   - `JWT_SECRET` = a strong random string
   - `NODE_ENV` = production
3. Start command: `node src/server.js`
4. The app auto-migrates on startup ✅

## Project Structure

```
linkbox/
├── config/
│   └── default.json        # Default configuration
├── data/
│   └── linkbox.db           # SQLite database (auto-created)
├── docs/
│   ├── API.md               # API documentation
│   └── SETUP.md             # This file
├── public/
│   └── index.html           # SPA frontend
├── src/
│   ├── config.js            # Config loader
│   ├── server.js            # Express entry point
│   ├── db/
│   │   ├── index.js         # Database connection
│   │   ├── migrate.js       # Migration script
│   │   └── schema.js        # Drizzle ORM schema
│   ├── middleware/
│   │   ├── authGuard.js     # JWT auth middleware
│   │   └── errorHandler.js  # Global error handler
│   ├── routes/
│   │   └── auth.js          # Auth endpoints
│   └── utils/
│       ├── response.js      # Response helpers
│       └── validators.js    # Input validators
├── tests/
│   └── auth.test.js         # Auth integration tests
├── .env.example
├── Dockerfile
├── package.json
└── vitest.config.js
```

## Running Tests

```bash
npm test           # run once
npm run test:watch # watch mode
```
```