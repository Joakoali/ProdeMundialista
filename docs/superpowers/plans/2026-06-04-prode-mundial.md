# Prode Mundial 2026 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-themed, Trade Republic-style World Cup 2026 prediction app where users predict match scores and goalscorers, earn points based on accuracy, and compete on a global leaderboard — with match data synced automatically from football-data.org.

**Architecture:** React (Vite) + Tailwind CSS frontend, Node.js + Express backend with JWT auth, PostgreSQL database. A cron job running every 5 minutes syncs match data, locks predictions at kick-off, and calculates points when matches finish.

**Tech Stack:** React 18, React Router v6, Framer Motion, Tailwind CSS v3, Node.js, Express, PostgreSQL (pg), bcrypt, jsonwebtoken, node-cron, axios, Jest, Supertest.

> ⚠️ **URGENCY:** The 2026 World Cup starts June 11, 2026. Prioritize tasks in order — the backend (Tasks 1–8) must be complete before the frontend has real data to work with.

---

## File Structure

```
ProdeMundialista/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js               # pg Pool, exports query()
│   │   │   ├── migrate.js             # runs 001_initial.sql
│   │   │   └── migrations/
│   │   │       └── 001_initial.sql    # all DDL
│   │   ├── middleware/
│   │   │   └── auth.js                # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.js                # POST /auth/register, /auth/login
│   │   │   ├── matches.js             # GET /matches, /matches/:id
│   │   │   ├── predictions.js         # POST /predictions (upsert)
│   │   │   ├── leaderboard.js         # GET /leaderboard
│   │   │   └── profile.js             # GET /profile
│   │   ├── services/
│   │   │   ├── scoring.js             # calculatePoints() — pure function
│   │   │   ├── footballApi.js         # football-data.org client
│   │   │   └── syncMatches.js         # sync + lock + score logic
│   │   ├── cron.js                    # schedules syncMatches every 5 min
│   │   └── app.js                     # Express app, mounts routes
│   ├── tests/
│   │   ├── scoring.test.js
│   │   ├── auth.test.js
│   │   └── predictions.test.js
│   ├── .env.example
│   ├── jest.config.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   └── Badge.jsx          # status badge (Abierto/En juego/Cerrado)
│   │   │   ├── Layout.jsx             # nav + <Outlet />
│   │   │   ├── MatchCard.jsx          # single match row
│   │   │   ├── ScorePicker.jsx        # animated +/- score stepper
│   │   │   └── GoalscorerPicker.jsx   # text input + chip list for scorers
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── PredictionPage.jsx
│   │   │   ├── LeaderboardPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── lib/
│   │   │   ├── api.js                 # fetch wrapper with JWT injection
│   │   │   └── utils.js               # formatDate()
│   │   ├── App.jsx                    # router + PrivateRoute
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

---

## Task 1: Backend scaffolding

**Files:**
- Create: `backend/package.json`
- Create: `backend/jest.config.js`
- Create: `backend/.env.example`
- Create: `backend/src/app.js`

- [ ] **Step 1: Create backend directory and package.json**

```bash
cd C:\Users\JoaquinOficina\Desktop\Proyectos\ProdeMundialista
mkdir backend
cd backend
```

Create `backend/package.json`:
```json
{
  "name": "prode-mundial-backend",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest --runInBand --forceExit",
    "migrate": "node src/db/migrate.js"
  },
  "dependencies": {
    "axios": "^1.6.8",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^3.0.3",
    "pg": "^8.11.5"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.0",
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run from `backend/`:
```bash
npm install
```
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create jest.config.js**

`backend/jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
};
```

- [ ] **Step 4: Create .env.example**

`backend/.env.example`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/prode_mundial
JWT_SECRET=change-me-to-a-long-random-string
FOOTBALL_API_KEY=your-football-data-org-api-key-here
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

> Get a free API key at https://www.football-data.org/client/register

- [ ] **Step 5: Copy .env.example to .env and fill in values**

```bash
copy .env.example .env
```

Fill in real `DATABASE_URL`, `JWT_SECRET`, and `FOOTBALL_API_KEY` before running.

- [ ] **Step 6: Create src/app.js**

`backend/src/app.js`:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
```

- [ ] **Step 7: Smoke-test the server**

```bash
npm run dev
```
Expected: `Server running on port 3001`

Open `http://localhost:3001/api/health` — should return `{"ok":true}`.

- [ ] **Step 8: Commit**

```bash
cd ..
git init
git add backend/
git commit -m "feat: backend scaffold with Express"
```

---

## Task 2: Database schema

**Files:**
- Create: `backend/src/db/migrations/001_initial.sql`
- Create: `backend/src/db/index.js`
- Create: `backend/src/db/migrate.js`

- [ ] **Step 1: Create the database locally**

```bash
psql -U postgres -c "CREATE DATABASE prode_mundial;"
```
Expected: `CREATE DATABASE`

- [ ] **Step 2: Create the migration SQL**

`backend/src/db/migrations/001_initial.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(50) UNIQUE NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  kickoff_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  home_score INT,
  away_score INT,
  home_scorers JSONB DEFAULT '[]',
  away_scorers JSONB DEFAULT '[]',
  stage VARCHAR(50) NOT NULL DEFAULT 'GROUP_STAGE',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home INT NOT NULL,
  predicted_away INT NOT NULL,
  predicted_scorers JSONB DEFAULT '[]',
  points_earned INT,
  locked_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
```

- [ ] **Step 3: Create db/index.js**

`backend/src/db/index.js`:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
```

- [ ] **Step 4: Create db/migrate.js**

`backend/src/db/migrate.js`:
```javascript
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_initial.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('Migration complete');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
```

- [ ] **Step 5: Run the migration**

```bash
npm run migrate
```
Expected: `Migration complete`

- [ ] **Step 6: Verify tables exist**

```bash
psql -U postgres -d prode_mundial -c "\dt"
```
Expected: tables `users`, `matches`, `predictions`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/db/
git commit -m "feat: database schema with users, matches, predictions"
```

---

## Task 3: Scoring service (TDD)

**Files:**
- Create: `backend/tests/scoring.test.js`
- Create: `backend/src/services/scoring.js`

- [ ] **Step 1: Write the failing tests**

`backend/tests/scoring.test.js`:
```javascript
const { calculatePoints } = require('../src/services/scoring');

const makeMatch = (homeScore, awayScore, homeScorers = [], awayScorers = []) => ({
  home_score: homeScore,
  away_score: awayScore,
  home_scorers: homeScorers,
  away_scorers: awayScorers,
});

const makePred = (home, away, scorers = []) => ({
  predicted_home: home,
  predicted_away: away,
  predicted_scorers: scorers,
});

describe('calculatePoints — result', () => {
  it('exact result → 5 pts', () => {
    expect(calculatePoints(makePred(2, 1), makeMatch(2, 1))).toBe(5);
  });

  it('correct winner (wrong score) → 2 pts', () => {
    expect(calculatePoints(makePred(1, 0), makeMatch(2, 1))).toBe(2);
  });

  it('correct draw (wrong exact score) → 3 pts', () => {
    expect(calculatePoints(makePred(0, 0), makeMatch(1, 1))).toBe(3);
  });

  it('exact draw → 5 pts (not 3)', () => {
    expect(calculatePoints(makePred(1, 1), makeMatch(1, 1))).toBe(5);
  });

  it('wrong winner → 0 pts', () => {
    expect(calculatePoints(makePred(0, 2), makeMatch(2, 1))).toBe(0);
  });

  it('0-0 exact → 5 pts', () => {
    expect(calculatePoints(makePred(0, 0), makeMatch(0, 0))).toBe(5);
  });
});

describe('calculatePoints — goalscorers', () => {
  it('wrong result + correct scorers → result pts + scorer pts (no multiplier)', () => {
    // correct winner (2 pts) + 2 scorers (2 pts, no ×2) = 4
    const match = makeMatch(2, 1, ['Messi', 'Lautaro'], []);
    expect(calculatePoints(makePred(1, 0, ['Messi', 'Lautaro']), match)).toBe(4);
  });

  it('exact result + correct scorers → 5 + scorers×2', () => {
    const match = makeMatch(2, 1, ['Messi', 'Lautaro'], []);
    expect(calculatePoints(makePred(2, 1, ['Messi', 'Lautaro']), match)).toBe(9);
  });

  it('scorer pts apply even with completely wrong result', () => {
    const match = makeMatch(2, 1, ['Messi'], []);
    expect(calculatePoints(makePred(0, 2, ['Messi']), match)).toBe(1);
  });

  it('partial scorer match — only matched goals count', () => {
    const match = makeMatch(2, 1, ['Messi', 'Lautaro'], []);
    // wrong result (correct winner=2pts) + 1 of 2 scorers = 3
    expect(calculatePoints(makePred(1, 0, ['Messi']), match)).toBe(3);
  });

  it('multi-goal scorer — min(predicted, actual) goals count', () => {
    // Messi scores 2, predict Messi×2: both counted
    const match = makeMatch(3, 0, ['Messi', 'Messi', 'Lautaro'], []);
    // exact result + Messi×2 = 5 + (2×2) = 9
    expect(calculatePoints(makePred(3, 0, ['Messi', 'Messi']), match)).toBe(9);
  });

  it('over-predicted scorer — capped at actual goals', () => {
    // Messi scores 1, predict Messi×3: only 1 counts
    const match = makeMatch(1, 0, ['Messi'], []);
    // exact result + min(3,1)×2 = 5 + 2 = 7
    expect(calculatePoints(makePred(1, 0, ['Messi', 'Messi', 'Messi']), match)).toBe(7);
  });

  it('no scorers predicted → only result pts', () => {
    const match = makeMatch(2, 1, ['Messi', 'Lautaro'], []);
    expect(calculatePoints(makePred(2, 1, []), match)).toBe(5);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- tests/scoring.test.js
```
Expected: `Cannot find module '../src/services/scoring'`

- [ ] **Step 3: Write the scoring service**

`backend/src/services/scoring.js`:
```javascript
function countOccurrences(arr) {
  return arr.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
}

function calculatePoints(prediction, match) {
  const { predicted_home, predicted_away, predicted_scorers = [] } = prediction;
  const { home_score, away_score, home_scorers = [], away_scorers = [] } = match;

  const isExact = predicted_home === home_score && predicted_away === away_score;
  let resultPoints = 0;

  if (isExact) {
    resultPoints = 5;
  } else {
    const predictedWinner =
      predicted_home > predicted_away ? 'home' :
      predicted_home < predicted_away ? 'away' : 'draw';
    const actualWinner =
      home_score > away_score ? 'home' :
      home_score < away_score ? 'away' : 'draw';

    if (predictedWinner === actualWinner) {
      resultPoints = predictedWinner === 'draw' ? 3 : 2;
    }
  }

  const allActualScorers = [...home_scorers, ...away_scorers];
  const actualCounts = countOccurrences(allActualScorers);
  const predictedCounts = countOccurrences(predicted_scorers);

  let goalscorerPoints = 0;
  for (const [player, predictedCount] of Object.entries(predictedCounts)) {
    const actualCount = actualCounts[player] || 0;
    goalscorerPoints += Math.min(predictedCount, actualCount);
  }

  if (isExact) {
    goalscorerPoints *= 2;
  }

  return resultPoints + goalscorerPoints;
}

module.exports = { calculatePoints };
```

- [ ] **Step 4: Run tests to confirm they all pass**

```bash
npm test -- tests/scoring.test.js
```
Expected: all 12 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/scoring.js backend/tests/scoring.test.js
git commit -m "feat: scoring service with full test coverage"
```

---

## Task 4: Auth backend

**Files:**
- Create: `backend/src/middleware/auth.js`
- Create: `backend/src/routes/auth.js`
- Modify: `backend/src/app.js`
- Create: `backend/tests/auth.test.js`

- [ ] **Step 1: Create JWT middleware**

`backend/src/middleware/auth.js`:
```javascript
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = authMiddleware;
```

- [ ] **Step 2: Create auth routes**

`backend/src/routes/auth.js`:
```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#82E0AA', '#F1948A',
];

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ message: 'Username must be 3-50 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Username already taken' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const result = await db.query(
      'INSERT INTO users (username, password_hash, avatar_color) VALUES ($1, $2, $3) RETURNING id, username, avatar_color',
      [username, passwordHash, avatarColor]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  try {
    const result = await db.query(
      'SELECT id, username, avatar_color, password_hash FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

- [ ] **Step 3: Mount auth routes in app.js**

Replace `backend/src/app.js` with:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  require('./cron');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
```

Note: `require('./cron')` will be added properly in Task 8 — leave it out for now, add it only in the `if (require.main === module)` block after Task 8 is done. For now just leave app.js without the cron line.

Actual `backend/src/app.js` right now:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
```

- [ ] **Step 4: Write auth tests**

`backend/tests/auth.test.js`:
```javascript
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

beforeEach(async () => {
  await db.query('DELETE FROM users');
});

afterAll(async () => {
  await db.pool.end();
});

describe('POST /api/auth/register', () => {
  it('creates user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects duplicate username', async () => {
    await request(app).post('/api/auth/register').send({ username: 'testuser', password: 'pass123' });
    const res = await request(app).post('/api/auth/register').send({ username: 'testuser', password: 'pass456' });
    expect(res.status).toBe(409);
  });

  it('rejects short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'user2', password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({ username: 'loginuser', password: 'mypassword' });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'loginuser', password: 'mypassword' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'loginuser', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown username', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'pass' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 5: Run auth tests**

```bash
npm test -- tests/auth.test.js
```
Expected: all 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/auth.js backend/src/middleware/auth.js backend/src/app.js backend/tests/auth.test.js
git commit -m "feat: auth endpoints (register, login) with JWT"
```

---

## Task 5: Football API service

**Files:**
- Create: `backend/src/services/footballApi.js`

- [ ] **Step 1: Create the football-data.org client**

`backend/src/services/footballApi.js`:
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY },
  timeout: 10000,
});

async function fetchWorldCupMatches() {
  const res = await client.get('/competitions/WC/matches');
  return res.data.matches;
}

async function fetchMatchDetail(externalId) {
  const res = await client.get(`/matches/${externalId}`);
  return res.data;
}

module.exports = { fetchWorldCupMatches, fetchMatchDetail };
```

- [ ] **Step 2: Manually test the API connection**

Create `backend/src/services/testApi.js` (delete after testing):
```javascript
require('dotenv').config();
const { fetchWorldCupMatches } = require('./footballApi');

fetchWorldCupMatches()
  .then(matches => {
    console.log(`Fetched ${matches.length} matches`);
    console.log('First match:', JSON.stringify(matches[0], null, 2));
  })
  .catch(err => console.error('Error:', err.message));
```

Run:
```bash
node src/services/testApi.js
```
Expected: output showing World Cup matches with `id`, `homeTeam`, `awayTeam`, `utcDate`, `status`.

Delete `testApi.js` after confirming.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/footballApi.js
git commit -m "feat: football-data.org API client"
```

---

## Task 6: Match sync service

**Files:**
- Create: `backend/src/services/syncMatches.js`

- [ ] **Step 1: Create syncMatches service**

`backend/src/services/syncMatches.js`:
```javascript
const db = require('../db');
const { fetchWorldCupMatches, fetchMatchDetail } = require('./footballApi');
const { calculatePoints } = require('./scoring');

const STATUS_MAP = {
  SCHEDULED: 'scheduled',
  TIMED: 'scheduled',
  IN_PLAY: 'live',
  PAUSED: 'live',
  FINISHED: 'finished',
  POSTPONED: 'scheduled',
  SUSPENDED: 'scheduled',
  CANCELLED: 'scheduled',
};

async function syncMatches() {
  try {
    const apiMatches = await fetchWorldCupMatches();
    for (const apiMatch of apiMatches) {
      await upsertMatch(apiMatch);
    }
    console.log(`[sync] ${apiMatches.length} matches processed`);
  } catch (err) {
    console.error('[sync] Error:', err.message);
  }
}

async function upsertMatch(apiMatch) {
  const status = STATUS_MAP[apiMatch.status] || 'scheduled';
  const externalId = String(apiMatch.id);

  const existing = await db.query(
    'SELECT * FROM matches WHERE external_id = $1',
    [externalId]
  );

  if (existing.rows.length === 0) {
    await db.query(
      `INSERT INTO matches (external_id, home_team, away_team, kickoff_at, status, stage)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        externalId,
        apiMatch.homeTeam.shortName || apiMatch.homeTeam.name,
        apiMatch.awayTeam.shortName || apiMatch.awayTeam.name,
        apiMatch.utcDate,
        status,
        apiMatch.stage || 'GROUP_STAGE',
      ]
    );
    return;
  }

  const match = existing.rows[0];

  if (match.status === status && status !== 'finished') return;

  if (status === 'live' && match.status === 'scheduled') {
    await db.query(
      `UPDATE predictions SET locked_at = NOW()
       WHERE match_id = $1 AND locked_at IS NULL`,
      [match.id]
    );
    await db.query(
      'UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2',
      ['live', match.id]
    );
    return;
  }

  if (status === 'finished' && match.status !== 'finished') {
    const detail = await fetchMatchDetail(apiMatch.id);
    const homeTeamId = apiMatch.homeTeam.id;

    const homeScorers = (detail.goals || [])
      .filter(g => g.team.id === homeTeamId && g.type !== 'OWN')
      .map(g => g.scorer.name);
    const awayScorers = (detail.goals || [])
      .filter(g => g.team.id !== homeTeamId && g.type !== 'OWN')
      .map(g => g.scorer.name);

    await db.query(
      `UPDATE matches
       SET status = 'finished',
           home_score = $1,
           away_score = $2,
           home_scorers = $3,
           away_scorers = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [
        apiMatch.score.fullTime.home,
        apiMatch.score.fullTime.away,
        JSON.stringify(homeScorers),
        JSON.stringify(awayScorers),
        match.id,
      ]
    );

    await scoreAllPredictions(match.id, {
      home_score: apiMatch.score.fullTime.home,
      away_score: apiMatch.score.fullTime.away,
      home_scorers: homeScorers,
      away_scorers: awayScorers,
    });
    return;
  }

  await db.query(
    'UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, match.id]
  );
}

async function scoreAllPredictions(matchId, matchResult) {
  const preds = await db.query(
    'SELECT * FROM predictions WHERE match_id = $1',
    [matchId]
  );
  for (const pred of preds.rows) {
    const points = calculatePoints(pred, matchResult);
    await db.query(
      'UPDATE predictions SET points_earned = $1 WHERE id = $2',
      [points, pred.id]
    );
  }
}

module.exports = { syncMatches };
```

- [ ] **Step 2: Run a manual sync to populate the DB**

Add this temporary line at the bottom of `syncMatches.js` (delete after testing):
```javascript
if (require.main === module) {
  require('dotenv').config();
  syncMatches().then(() => process.exit());
}
```

Run:
```bash
node src/services/syncMatches.js
```
Expected: `[sync] N matches processed`

Verify matches in DB:
```bash
psql -U postgres -d prode_mundial -c "SELECT home_team, away_team, kickoff_at, status FROM matches LIMIT 5;"
```

Delete the `if (require.main === module)` block from syncMatches.js after confirming.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/syncMatches.js
git commit -m "feat: match sync service with lock and scoring logic"
```

---

## Task 7: API routes (matches, predictions, leaderboard, profile)

**Files:**
- Create: `backend/src/routes/matches.js`
- Create: `backend/src/routes/predictions.js`
- Create: `backend/src/routes/leaderboard.js`
- Create: `backend/src/routes/profile.js`
- Create: `backend/tests/predictions.test.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Create matches routes**

`backend/src/routes/matches.js`:
```javascript
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.*,
        p.predicted_home, p.predicted_away, p.predicted_scorers, p.points_earned, p.locked_at
       FROM matches m
       LEFT JOIN predictions p ON p.match_id = m.id AND p.user_id = $1
       ORDER BY m.kickoff_at ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const matchResult = await db.query(
      'SELECT * FROM matches WHERE id = $1',
      [req.params.id]
    );
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }
    const predResult = await db.query(
      'SELECT * FROM predictions WHERE match_id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({
      ...matchResult.rows[0],
      prediction: predResult.rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Create predictions routes**

`backend/src/routes/predictions.js`:
```javascript
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { match_id, predicted_home, predicted_away, predicted_scorers = [] } = req.body;

  if (!match_id || predicted_home === undefined || predicted_away === undefined) {
    return res.status(400).json({
      message: 'match_id, predicted_home, and predicted_away are required',
    });
  }
  if (predicted_home < 0 || predicted_away < 0) {
    return res.status(400).json({ message: 'Scores cannot be negative' });
  }

  try {
    const matchResult = await db.query(
      'SELECT id, status FROM matches WHERE id = $1',
      [match_id]
    );
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }
    if (matchResult.rows[0].status !== 'scheduled') {
      return res.status(403).json({ message: 'Match has already started — predictions are locked' });
    }

    const result = await db.query(
      `INSERT INTO predictions
         (user_id, match_id, predicted_home, predicted_away, predicted_scorers, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, match_id) DO UPDATE
         SET predicted_home = $3,
             predicted_away = $4,
             predicted_scorers = $5,
             updated_at = NOW()
       RETURNING *`,
      [req.userId, match_id, predicted_home, predicted_away, JSON.stringify(predicted_scorers)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

- [ ] **Step 3: Create leaderboard route**

`backend/src/routes/leaderboard.js`:
```javascript
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        u.id,
        u.username,
        u.avatar_color,
        COALESCE(SUM(p.points_earned), 0)::int AS total_points,
        COUNT(p.id)::int AS matches_predicted,
        RANK() OVER (ORDER BY COALESCE(SUM(p.points_earned), 0) DESC) AS rank
       FROM users u
       LEFT JOIN predictions p ON p.user_id = u.id
       GROUP BY u.id, u.username, u.avatar_color
       ORDER BY total_points DESC, u.username ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

- [ ] **Step 4: Create profile route**

`backend/src/routes/profile.js`:
```javascript
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT id, username, avatar_color, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const predictionsResult = await db.query(
      `SELECT
        p.*,
        m.home_team, m.away_team, m.home_score, m.away_score,
        m.kickoff_at, m.status, m.stage
       FROM predictions p
       JOIN matches m ON m.id = p.match_id
       WHERE p.user_id = $1
       ORDER BY m.kickoff_at DESC`,
      [req.userId]
    );

    const statsResult = await db.query(
      `SELECT
        COALESCE(SUM(p.points_earned), 0)::int AS total_points,
        COUNT(p.id)::int AS total_predictions,
        COUNT(p.id) FILTER (
          WHERE m.status = 'finished'
          AND p.predicted_home = m.home_score
          AND p.predicted_away = m.away_score
        )::int AS exact_results
       FROM predictions p
       LEFT JOIN matches m ON m.id = p.match_id
       WHERE p.user_id = $1`,
      [req.userId]
    );

    res.json({
      user: userResult.rows[0],
      predictions: predictionsResult.rows,
      stats: statsResult.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

- [ ] **Step 5: Mount all routes in app.js**

Replace `backend/src/app.js`:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const predictionRoutes = require('./routes/predictions');
const leaderboardRoutes = require('./routes/leaderboard');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
```

- [ ] **Step 6: Write predictions tests**

`backend/tests/predictions.test.js`:
```javascript
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

let token;
let matchId;

beforeAll(async () => {
  await db.query('DELETE FROM predictions');
  await db.query('DELETE FROM matches');
  await db.query('DELETE FROM users');

  const reg = await request(app)
    .post('/api/auth/register')
    .send({ username: 'preduser', password: 'password123' });
  token = reg.body.token;

  const match = await db.query(
    `INSERT INTO matches (external_id, home_team, away_team, kickoff_at, status, stage)
     VALUES ('ext-999', 'Argentina', 'Brazil', NOW() + interval '1 hour', 'scheduled', 'GROUP_STAGE')
     RETURNING id`
  );
  matchId = match.rows[0].id;
});

afterAll(async () => {
  await db.pool.end();
});

describe('POST /api/predictions', () => {
  it('creates a prediction', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ match_id: matchId, predicted_home: 2, predicted_away: 1, predicted_scorers: ['Messi'] });
    expect(res.status).toBe(201);
    expect(res.body.predicted_home).toBe(2);
  });

  it('updates existing prediction (upsert)', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ match_id: matchId, predicted_home: 3, predicted_away: 0 });
    expect(res.status).toBe(201);
    expect(res.body.predicted_home).toBe(3);
  });

  it('rejects prediction on live match', async () => {
    await db.query("UPDATE matches SET status = 'live' WHERE id = $1", [matchId]);
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ match_id: matchId, predicted_home: 1, predicted_away: 1 });
    expect(res.status).toBe(403);
    await db.query("UPDATE matches SET status = 'scheduled' WHERE id = $1", [matchId]);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .send({ match_id: matchId, predicted_home: 1, predicted_away: 0 });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 7: Run predictions tests**

```bash
npm test -- tests/predictions.test.js
```
Expected: all 4 tests PASS.

- [ ] **Step 8: Run all tests to ensure nothing is broken**

```bash
npm test
```
Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/routes/ backend/src/app.js backend/tests/predictions.test.js
git commit -m "feat: all API routes (matches, predictions, leaderboard, profile)"
```

---

## Task 8: Cron job

**Files:**
- Create: `backend/src/cron.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Create cron.js**

`backend/src/cron.js`:
```javascript
const cron = require('node-cron');
const { syncMatches } = require('./services/syncMatches');

cron.schedule('*/5 * * * *', async () => {
  console.log('[cron] Syncing matches...');
  await syncMatches();
});

console.log('[cron] Match sync scheduled (every 5 minutes)');
```

- [ ] **Step 2: Wire cron into app.js startup**

In `backend/src/app.js`, update the `if (require.main === module)` block:
```javascript
if (require.main === module) {
  require('./cron');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
```

- [ ] **Step 3: Verify cron starts with the server**

```bash
npm run dev
```
Expected output includes:
```
[cron] Match sync scheduled (every 5 minutes)
Server running on port 3001
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/cron.js backend/src/app.js
git commit -m "feat: cron job syncing matches every 5 minutes"
```

---

## Task 9: Frontend scaffolding & design system

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/src/index.css`
- Create: `frontend/src/main.jsx`
- Create: `frontend/.env.example`

- [ ] **Step 1: Create frontend directory and package.json**

`frontend/package.json`:
```json
{
  "name": "prode-mundial-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^11.2.10",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.2.13"
  }
}
```

- [ ] **Step 2: Install frontend dependencies**

```bash
cd frontend
npm install
```

- [ ] **Step 3: Create vite.config.js**

`frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 4: Create postcss.config.js**

`frontend/postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create tailwind.config.js**

`frontend/tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A0A0A',
        surface: '#1A1A1A',
        elevated: '#242424',
        primary: '#FFFFFF',
        secondary: '#666666',
        green: '#00C896',
        red: '#FF4D4D',
        yellow: '#F5A623',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Create index.html**

`frontend/index.html`:
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prode Mundial 2026</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create src/index.css**

`frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    @apply bg-base text-primary font-sans;
  }
  ::selection {
    @apply bg-green text-base;
  }
}
```

- [ ] **Step 8: Create src/main.jsx**

`frontend/src/main.jsx`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 9: Create a placeholder App.jsx**

`frontend/src/App.jsx`:
```jsx
export default function App() {
  return <div className="p-8 text-primary text-2xl font-bold">Prode Mundial 2026</div>;
}
```

- [ ] **Step 10: Create .env.example**

`frontend/.env.example`:
```
VITE_API_URL=http://localhost:3001/api
```

Copy to `.env`:
```bash
copy .env.example .env
```

- [ ] **Step 11: Start the dev server and verify**

```bash
npm run dev
```
Expected: Vite dev server at `http://localhost:5173`. Page shows "Prode Mundial 2026" in white on black background — confirming Tailwind and fonts are working.

- [ ] **Step 12: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: frontend scaffold with Tailwind dark design system"
```

---

## Task 10: API client & auth page

**Files:**
- Create: `frontend/src/lib/api.js`
- Create: `frontend/src/lib/utils.js`
- Create: `frontend/src/hooks/useAuth.js`
- Create: `frontend/src/pages/AuthPage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create API client**

`frontend/src/lib/api.js`:
```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body) }),
};
```

- [ ] **Step 2: Create utils.js**

`frontend/src/lib/utils.js`:
```javascript
export function formatDate(isoString) {
  return new Date(isoString).toLocaleString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

- [ ] **Step 3: Create useAuth hook**

`frontend/src/hooks/useAuth.js`:
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function login(username, password) {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function register(username, password) {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await api.post('/auth/register', { username, password });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { login, register, loading, error };
}
```

- [ ] **Step 4: Create AuthPage.jsx**

`frontend/src/pages/AuthPage.jsx`:
```jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loading, error } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') login(username, password);
    else register(username, password);
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold mb-1 tracking-tight">Prode Mundial</h1>
        <p className="text-secondary text-sm mb-10">
          {mode === 'login' ? 'Ingresá con tu usuario' : 'Creá tu cuenta'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full bg-surface border border-elevated text-primary placeholder:text-secondary px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full bg-surface border border-elevated text-primary placeholder:text-secondary px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
          />

          {error && <p className="text-red text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green text-base font-semibold py-3 text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? '...' : mode === 'login' ? 'Ingresar' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-6 text-center text-secondary text-xs">
          {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-primary underline"
          >
            {mode === 'login' ? 'Registrate' : 'Ingresá'}
          </button>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Layout.jsx**

`frontend/src/components/Layout.jsx`:
```jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${isActive ? 'text-primary' : 'text-secondary hover:text-primary'}`;

  return (
    <div className="min-h-screen bg-base text-primary font-sans">
      <nav className="border-b border-elevated px-6 py-4 flex items-center justify-between">
        <NavLink to="/" className="text-base font-bold tracking-tight">
          Prode Mundial 2026
        </NavLink>
        <div className="flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>Partidos</NavLink>
          <NavLink to="/leaderboard" className={linkClass}>Ranking</NavLink>
          <NavLink to="/profile" className={linkClass}>Mi Perfil</NavLink>
          <button onClick={handleLogout} className="text-sm text-secondary hover:text-primary transition-colors">
            Salir
          </button>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Wire up App.jsx with routing**

`frontend/src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<div className="text-secondary text-sm">Cargando...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 7: Test auth flow in browser**

Start both servers:
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`:
- Should redirect to `/auth`
- Register a user — should redirect to `/`
- Refresh — should stay on `/` (token persisted)
- Click "Salir" — should return to `/auth`
- Log back in — should work

- [ ] **Step 8: Commit**

```bash
git add frontend/src/
git commit -m "feat: auth page, routing, API client, layout shell"
```

---

## Task 11: Home page & MatchCard

**Files:**
- Create: `frontend/src/components/ui/Badge.jsx`
- Create: `frontend/src/components/MatchCard.jsx`
- Create: `frontend/src/pages/HomePage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create Badge component**

`frontend/src/components/ui/Badge.jsx`:
```jsx
const CONFIG = {
  scheduled: { label: 'Abierto', className: 'text-secondary border-elevated' },
  live: { label: 'En juego', className: 'text-yellow border-yellow' },
  finished: { label: 'Finalizado', className: 'text-secondary border-elevated' },
};

export default function Badge({ status }) {
  const c = CONFIG[status] || CONFIG.scheduled;
  return (
    <span className={`text-xs border px-2 py-0.5 ${c.className}`}>
      {c.label}
    </span>
  );
}
```

- [ ] **Step 2: Create MatchCard component**

`frontend/src/components/MatchCard.jsx`:
```jsx
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';
import { formatDate } from '../lib/utils';

export default function MatchCard({ match }) {
  const navigate = useNavigate();
  const isPredicted =
    match.predicted_home !== null && match.predicted_home !== undefined;
  const isLocked = match.status !== 'scheduled';

  return (
    <motion.div
      whileHover={!isLocked ? { backgroundColor: '#1A1A1A' } : {}}
      onClick={() => navigate(`/match/${match.id}`)}
      className={`border-b border-elevated py-4 cursor-pointer transition-colors ${
        isLocked ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm truncate">{match.home_team}</span>
            <span className="text-secondary text-xs flex-shrink-0">vs</span>
            <span className="font-bold text-sm truncate">{match.away_team}</span>
          </div>
          <span className="text-secondary text-xs">{formatDate(match.kickoff_at)}</span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {isPredicted && (
            <span className="text-secondary text-xs tabular-nums">
              {match.predicted_home}–{match.predicted_away}
            </span>
          )}
          {match.status === 'finished' && match.points_earned !== null && (
            <span className="text-green text-sm font-bold tabular-nums">
              +{match.points_earned}
            </span>
          )}
          <Badge status={match.status} />
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Create HomePage.jsx**

`frontend/src/pages/HomePage.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import MatchCard from '../components/MatchCard';

const STAGES = [
  { key: 'ALL', label: 'Todos' },
  { key: 'GROUP_STAGE', label: 'Grupos' },
  { key: 'ROUND_OF_16', label: 'Octavos' },
  { key: 'QUARTER_FINALS', label: 'Cuartos' },
  { key: 'SEMI_FINALS', label: 'Semis' },
  { key: 'FINAL', label: 'Final' },
];

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [stage, setStage] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/matches').then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const filtered =
    stage === 'ALL' ? matches : matches.filter((m) => m.stage === stage);

  if (loading) {
    return <div className="text-secondary text-sm">Cargando partidos...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Partidos</h1>

      <div className="flex gap-6 mb-6 overflow-x-auto pb-1">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStage(s.key)}
            className={`text-xs whitespace-nowrap transition-colors pb-1 ${
              stage === s.key
                ? 'text-primary border-b border-primary'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-secondary text-sm">
          No hay partidos en esta fase todavía.
        </p>
      ) : (
        <div>
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add HomePage to router**

Update `frontend/src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: Verify in browser**

Open `http://localhost:5173` — should see list of World Cup matches. Stage filter tabs should work. Locked matches (live/finished) should appear at 50% opacity.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: home page with match feed, stage filter, and MatchCard"
```

---

## Task 12: Prediction page

**Files:**
- Create: `frontend/src/components/ScorePicker.jsx`
- Create: `frontend/src/components/GoalscorerPicker.jsx`
- Create: `frontend/src/pages/PredictionPage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create ScorePicker component**

`frontend/src/components/ScorePicker.jsx`:
```jsx
import { AnimatePresence, motion } from 'framer-motion';

function ScoreDigit({ value }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ scale: 1.25, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="text-6xl font-bold tabular-nums w-16 text-center inline-block"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

export default function ScorePicker({
  homeScore,
  awayScore,
  onHomeChange,
  onAwayChange,
  disabled,
}) {
  if (disabled) {
    return (
      <div className="flex items-center justify-center gap-8 py-10">
        <span className="text-6xl font-bold tabular-nums">{homeScore}</span>
        <span className="text-secondary text-3xl">–</span>
        <span className="text-6xl font-bold tabular-nums">{awayScore}</span>
      </div>
    );
  }

  const btn = 'w-9 h-9 flex items-center justify-center text-secondary hover:text-primary transition-colors text-2xl leading-none';

  return (
    <div className="flex items-center justify-center gap-8 py-10">
      <div className="flex flex-col items-center gap-3">
        <button className={btn} onClick={() => onHomeChange(homeScore + 1)}>+</button>
        <ScoreDigit value={homeScore} />
        <button className={btn} onClick={() => onHomeChange(Math.max(0, homeScore - 1))}>−</button>
      </div>

      <span className="text-secondary text-3xl">–</span>

      <div className="flex flex-col items-center gap-3">
        <button className={btn} onClick={() => onAwayChange(awayScore + 1)}>+</button>
        <ScoreDigit value={awayScore} />
        <button className={btn} onClick={() => onAwayChange(Math.max(0, awayScore - 1))}>−</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create GoalscorerPicker component**

`frontend/src/components/GoalscorerPicker.jsx`:
```jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoalscorerPicker({ selectedScorers, onChange, disabled }) {
  const [input, setInput] = useState('');

  const addScorer = () => {
    const name = input.trim();
    if (!name) return;
    onChange([...selectedScorers, name]);
    setInput('');
  };

  const removeAt = (index) => {
    onChange(selectedScorers.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addScorer();
    }
  };

  return (
    <div className="mt-8">
      <p className="text-secondary text-xs uppercase tracking-wider mb-4">
        Goleadores <span className="normal-case">(opcional)</span>
      </p>

      {!disabled && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nombre del jugador"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-surface border border-elevated text-primary placeholder:text-secondary px-3 py-2 text-sm focus:outline-none focus:border-secondary transition-colors"
          />
          <button
            type="button"
            onClick={addScorer}
            className="px-4 py-2 border border-elevated text-secondary text-lg hover:text-primary hover:border-secondary transition-colors"
          >
            +
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {selectedScorers.map((name, idx) => (
            <motion.div
              key={`${name}-${idx}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-1 border border-green text-green text-xs px-3 py-1.5"
            >
              <span>{name}</span>
              {!disabled && (
                <button
                  onClick={() => removeAt(idx)}
                  className="ml-1 text-green hover:text-red transition-colors"
                >
                  ×
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selectedScorers.length === 0 && disabled && (
        <p className="text-secondary text-xs">Sin goleadores predichos.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create PredictionPage.jsx**

`frontend/src/pages/PredictionPage.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import ScorePicker from '../components/ScorePicker';
import GoalscorerPicker from '../components/GoalscorerPicker';
import Badge from '../components/ui/Badge';
import { formatDate } from '../lib/utils';

export default function PredictionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [scorers, setScorers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/matches/${id}`).then((data) => {
      setMatchData(data);
      if (data.prediction) {
        setHomeScore(data.prediction.predicted_home);
        setAwayScore(data.prediction.predicted_away);
        setScorers(data.prediction.predicted_scorers || []);
      }
    });
  }, [id]);

  if (!matchData) {
    return <div className="text-secondary text-sm">Cargando...</div>;
  }

  const isLocked = matchData.status !== 'scheduled';

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post('/predictions', {
        match_id: id,
        predicted_home: homeScore,
        predicted_away: awayScore,
        predicted_scorers: scorers,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="text-secondary text-xs mb-6 hover:text-primary transition-colors"
      >
        ← Volver
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold">
            {matchData.home_team} vs {matchData.away_team}
          </h2>
          <p className="text-secondary text-xs mt-1">
            {formatDate(matchData.kickoff_at)}
          </p>
        </div>
        <Badge status={matchData.status} />
      </div>

      {isLocked && matchData.status === 'live' && (
        <p className="text-yellow text-xs mt-4">Partido en juego — predicción cerrada.</p>
      )}
      {isLocked && matchData.status === 'finished' && (
        <p className="text-secondary text-xs mt-4">
          Resultado final:{' '}
          <span className="text-primary font-bold">
            {matchData.home_score}–{matchData.away_score}
          </span>
          {matchData.prediction?.points_earned !== null &&
            matchData.prediction?.points_earned !== undefined && (
              <span className="text-green font-bold ml-2">
                +{matchData.prediction.points_earned} pts
              </span>
            )}
        </p>
      )}

      <div className={isLocked ? 'opacity-50 pointer-events-none' : ''}>
        <ScorePicker
          homeScore={homeScore}
          awayScore={awayScore}
          onHomeChange={setHomeScore}
          onAwayChange={setAwayScore}
          disabled={isLocked}
        />

        <div className="flex justify-center gap-16 text-xs text-secondary -mt-4 mb-8">
          <span>{matchData.home_team}</span>
          <span>{matchData.away_team}</span>
        </div>

        <GoalscorerPicker
          selectedScorers={scorers}
          onChange={setScorers}
          disabled={isLocked}
        />
      </div>

      {!isLocked && (
        <div className="mt-10">
          {error && <p className="text-red text-xs mb-3">{error}</p>}
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
              saved
                ? 'bg-green text-base'
                : 'bg-surface border border-elevated text-primary hover:bg-elevated'
            }`}
          >
            {saved
              ? '✓ Predicción guardada'
              : saving
              ? 'Guardando...'
              : matchData.prediction
              ? 'Actualizar predicción'
              : 'Confirmar predicción'}
          </motion.button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add PredictionPage to router**

Update `frontend/src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import PredictionPage from './pages/PredictionPage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="match/:id" element={<PredictionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: Test prediction flow in browser**

- Click on an open match → prediction screen should open
- Change score with +/− buttons → numbers animate
- Add a goalscorer name → chip appears with animation
- Remove a chip → fades out
- Click "Confirmar" → button turns green with checkmark
- Go back to home → match card shows predicted score
- Click locked match → everything at 50% opacity, no inputs

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: prediction screen with animated score picker and goalscorer input"
```

---

## Task 13: Leaderboard page

**Files:**
- Create: `frontend/src/pages/LeaderboardPage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create LeaderboardPage.jsx**

`frontend/src/pages/LeaderboardPage.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    api.get('/leaderboard').then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-secondary text-sm">Cargando ranking...</div>;
  }

  const myEntry = entries.find((e) => e.id === currentUser.id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ranking</h1>

      {myEntry && (
        <div className="border border-green px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-secondary text-xs w-6 text-right">
              #{myEntry.rank}
            </span>
            <div
              className="w-5 h-5 rounded-full flex-shrink-0"
              style={{ backgroundColor: myEntry.avatar_color }}
            />
            <span className="text-sm font-medium">{myEntry.username}</span>
            <span className="text-secondary text-xs">Vos</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-secondary text-xs">
              {myEntry.matches_predicted} partidos
            </span>
            <span className="text-green font-bold">
              {myEntry.total_points} pts
            </span>
          </div>
        </div>
      )}

      <div>
        {entries.map((entry) => {
          const isMe = entry.id === currentUser.id;
          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between py-3 border-b border-elevated ${
                isMe ? 'opacity-30' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-secondary text-xs w-6 text-right">
                  #{entry.rank}
                </span>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.avatar_color }}
                />
                <span className="text-sm">{entry.username}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-secondary text-xs">
                  {entry.matches_predicted} partidos
                </span>
                <span className="text-green font-bold text-sm tabular-nums">
                  {entry.total_points} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add LeaderboardPage to router**

Update `frontend/src/App.jsx` — add the import and route:
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import PredictionPage from './pages/PredictionPage';
import LeaderboardPage from './pages/LeaderboardPage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="match/:id" element={<PredictionPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Test leaderboard in browser**

Navigate to `/leaderboard`:
- Your own entry should appear pinned at top with green border
- All users listed below, your row dimmed
- If only one user exists, only the pinned row shows

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: leaderboard page with pinned own-row"
```

---

## Task 14: Profile page

**Files:**
- Create: `frontend/src/pages/ProfilePage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create ProfilePage.jsx**

`frontend/src/pages/ProfilePage.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

export default function ProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/profile').then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-secondary text-sm">Cargando...</div>;
  }

  const { user, predictions, stats } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: user.avatar_color }}
        />
        <div>
          <h1 className="text-xl font-bold">{user.username}</h1>
          <p className="text-secondary text-xs">
            Desde {new Date(user.created_at).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="bg-surface p-4">
          <p className="text-green text-2xl font-bold tabular-nums">
            {stats.total_points}
          </p>
          <p className="text-secondary text-xs mt-1">Puntos</p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-primary text-2xl font-bold tabular-nums">
            {stats.total_predictions}
          </p>
          <p className="text-secondary text-xs mt-1">Predicciones</p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-primary text-2xl font-bold tabular-nums">
            {stats.exact_results}
          </p>
          <p className="text-secondary text-xs mt-1">Exactos</p>
        </div>
      </div>

      <p className="text-secondary text-xs uppercase tracking-wider mb-4">
        Historial
      </p>

      {predictions.length === 0 && (
        <p className="text-secondary text-sm">
          Todavía no predijiste ningún partido.
        </p>
      )}

      <div>
        {predictions.map((pred) => {
          const isFinished = pred.status === 'finished';
          const isExact =
            isFinished &&
            pred.predicted_home === pred.home_score &&
            pred.predicted_away === pred.away_score;

          return (
            <div key={pred.id} className="border-b border-elevated py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {pred.home_team} vs {pred.away_team}
                  </p>
                  <p className="text-secondary text-xs mt-0.5">
                    {formatDate(pred.kickoff_at)}
                  </p>
                </div>
                {isFinished && pred.points_earned !== null && (
                  <span className="text-green font-bold text-sm tabular-nums">
                    +{pred.points_earned} pts
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2">
                <span className="text-secondary text-xs">
                  Tu predicción:{' '}
                  <span className="text-primary tabular-nums">
                    {pred.predicted_home}–{pred.predicted_away}
                  </span>
                </span>
                {isFinished && pred.home_score !== null && (
                  <span className="text-secondary text-xs">
                    Resultado:{' '}
                    <span
                      className={`tabular-nums ${isExact ? 'text-green' : 'text-primary'}`}
                    >
                      {pred.home_score}–{pred.away_score}
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add ProfilePage to router**

Update `frontend/src/App.jsx` (final version):
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import PredictionPage from './pages/PredictionPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="match/:id" element={<PredictionPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Test profile page in browser**

Navigate to `/profile`:
- Avatar color circle and username shown
- 3 stat cards (Puntos, Predicciones, Exactos)
- Historial list with all predictions
- Finished matches show result; exact results highlighted green

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: profile page with stats and prediction history"
```

---

## Task 15: Deploy

**Files:**
- Create: `frontend/vercel.json`
- Create: `backend/railway.json` (optional — Railway auto-detects Node)

- [ ] **Step 1: Create Vercel config for SPA routing**

`frontend/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Build the frontend locally to verify no errors**

```bash
cd frontend && npm run build
```
Expected: `dist/` folder created with no TypeScript/build errors.

- [ ] **Step 3: Deploy backend to Railway**

1. Go to https://railway.app and create a new project
2. Add a PostgreSQL service — copy the `DATABASE_URL` from the variables tab
3. Add a Node.js service from GitHub (point to the `backend/` folder — set Root Directory to `backend`)
4. Set environment variables in Railway: `DATABASE_URL`, `JWT_SECRET`, `FOOTBALL_API_KEY`, `FRONTEND_URL` (set to your Vercel URL once known), `NODE_ENV=production`
5. Set the start command to `npm start`
6. After deploy, run migration: in Railway shell run `npm run migrate`

- [ ] **Step 4: Deploy frontend to Vercel**

1. Go to https://vercel.com and import the repo
2. Set Root Directory to `frontend/`
3. Set environment variable: `VITE_API_URL=https://your-railway-backend-url/api`
4. Deploy

- [ ] **Step 5: Verify production deploy**

- Open the Vercel URL
- Register a new user
- Navigate to matches — they should load from the backend
- Make a prediction — it should save
- Check leaderboard

- [ ] **Step 6: Update FRONTEND_URL in Railway**

Update the `FRONTEND_URL` environment variable in Railway to the actual Vercel URL (not localhost), then redeploy.

- [ ] **Step 7: Final commit**

```bash
git add frontend/vercel.json
git commit -m "feat: deploy config for Vercel (frontend) and Railway (backend)"
```

---

## Self-Review Checklist

| Spec requirement | Task |
|---|---|
| Auth (username + password, JWT) | Task 4, 10 |
| Match feed with stage filter | Task 11 |
| Prediction screen (score stepper + goalscorers) | Task 12 |
| Predictions locked at kick-off | Task 6 (sync locks), Task 7 (API enforces), Task 12 (UI read-only) |
| Edit prediction before kick-off | Task 7 (upsert), Task 12 (button label changes) |
| Scoring: exact result = 5 pts | Task 3 |
| Scoring: correct winner = 2 pts, correct draw = 3 pts | Task 3 |
| Scoring: goalscorer = 1 pt (always) | Task 3 |
| Scoring: ×2 multiplier on goalscorers if exact result | Task 3 |
| Automatic sync from football-data.org | Task 5, 6, 8 |
| Leaderboard (global, own row pinned) | Task 7, 13 |
| Profile (stats + history) | Task 7, 14 |
| Dark Trade Republic-style UI | Tasks 9–14 (Tailwind tokens + Framer Motion) |
| Deploy (Vercel + Railway) | Task 15 |
