# Three UX Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three isolated UX improvements: auto-redirect after saving a prediction, limit goalscorer selections to the total predicted goals, and add a "Ranking chico" mini-leaderboard for 3 specific users from 2026-06-24.

**Architecture:** Feature 1 is a one-line change to `PredictionPage`. Feature 2 adds a `useEffect` in `PredictionPage` and a `maxScorers` prop to `GoalscorerPicker`. Feature 3 adds a backend route `GET /leaderboard/personal` and a conditional block in `LeaderboardPage`.

**Tech Stack:** React 18 (Vite), Express.js, PostgreSQL (`pg`), Jest + supertest (backend tests only — no frontend test framework).

---

## File Map

| File | Change |
|---|---|
| `frontend/src/pages/PredictionPage.jsx` | Feature 1: change `setTimeout` target. Feature 2: add `useEffect` for score trim + pass `maxScorers` prop. |
| `frontend/src/components/GoalscorerPicker.jsx` | Feature 2: accept `maxScorers`, enforce cap on add, update header counter. |
| `backend/src/routes/leaderboard.js` | Feature 3: add `GET /personal` route. |
| `backend/tests/leaderboard.test.js` | Feature 3: new test file for the personal endpoint. |
| `frontend/src/pages/LeaderboardPage.jsx` | Feature 3: conditional fetch + render of "Ranking chico" block. |

---

## Task 1: Redirect after saving prediction

**Files:**
- Modify: `frontend/src/pages/PredictionPage.jsx:72`

- [ ] **Step 1: Edit the setTimeout in handleSave**

In `PredictionPage.jsx`, find the `handleSave` function. Replace:

```js
setSaved(true);
setTimeout(() => setSaved(false), 2500);
```

With:

```js
setSaved(true);
setTimeout(() => navigate('/'), 1500);
```

- [ ] **Step 2: Verify manually**

Run `npm run dev` inside `frontend/`. Save a prediction on any unlocked match. Confirm: the green "✓ Predicción guardada" tick appears, then after ~1.5 seconds the app navigates to `/`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PredictionPage.jsx
git commit -m "feat: redirect to home after saving prediction"
```

---

## Task 2: Limit goalscorers to total predicted goals

**Files:**
- Modify: `frontend/src/pages/PredictionPage.jsx`
- Modify: `frontend/src/components/GoalscorerPicker.jsx`

### Part A — PredictionPage: trim scorers on score change and pass maxScorers

- [ ] **Step 1: Add useEffect for automatic trim**

In `PredictionPage.jsx`, after the existing `useEffect` that fetches match data (line ~40), add:

```js
useEffect(() => {
  const totalGoals = homeScore + awayScore;
  if (scorers.length > totalGoals) {
    setScorers((prev) => prev.slice(0, totalGoals));
  }
}, [homeScore, awayScore]);
```

- [ ] **Step 2: Pass maxScorers to GoalscorerPicker**

In `PredictionPage.jsx`, find the `<GoalscorerPicker>` JSX block (currently lines ~145–151) and add the `maxScorers` prop:

```jsx
<GoalscorerPicker
  selectedScorers={scorers}
  onChange={setScorers}
  disabled={isLocked}
  homeSquad={squads?.home}
  awaySquad={squads?.away}
  maxScorers={homeScore + awayScore}
/>
```

### Part B — GoalscorerPicker: enforce cap and show counter

- [ ] **Step 3: Accept maxScorers prop and update addScorer**

In `GoalscorerPicker.jsx`, update the component signature and `addScorer` function:

```js
export default function GoalscorerPicker({ selectedScorers, onChange, disabled, homeSquad, awaySquad, maxScorers = Infinity }) {
  const scorerCounts = countOccurrences(selectedScorers);

  const addScorer = (name) => {
    if (selectedScorers.length >= maxScorers) return;
    onChange([...selectedScorers, name]);
  };

  // removeOne stays unchanged
  const removeOne = (name) => {
    const idx = selectedScorers.lastIndexOf(name);
    if (idx === -1) return;
    onChange(selectedScorers.filter((_, i) => i !== idx));
  };

  const homePlayers = homeSquad?.players ?? [];
  const awayPlayers = awaySquad?.players ?? [];
  // ...
```

- [ ] **Step 4: Update header to show counter**

In `GoalscorerPicker.jsx`, replace the `<p>` header inside the returned JSX from:

```jsx
<p className="text-secondary text-xs uppercase tracking-wider">
  Goleadores <span className="normal-case">(opcional)</span>
</p>
```

To:

```jsx
<p className="text-secondary text-xs uppercase tracking-wider">
  Goleadores{' '}
  <span className="normal-case">
    ({selectedScorers.length}/{maxScorers === Infinity ? '∞' : maxScorers})
  </span>
</p>
```

- [ ] **Step 5: Disable add buttons when at cap**

In `TeamSection`, the `onClick` handler already calls `onAdd(player)` which is now guarded in `addScorer`. But to give a visual cue, pass an `atCap` boolean down and apply `disabled` or `opacity` styling.

Update `TeamSection` signature:

```js
function TeamSection({ teamName, players, scorerCounts, onAdd, onRemove, disabled, atCap }) {
```

In the `motion.button` inside `TeamSection`, change the disabled condition:

```jsx
<motion.button
  key={player}
  type="button"
  disabled={disabled || (atCap && (scorerCounts[player] || 0) === 0)}
  onClick={() => !disabled && onAdd(player)}
  whileTap={(disabled || (atCap && (scorerCounts[player] || 0) === 0)) ? undefined : { scale: 0.93 }}
  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors disabled:opacity-40 disabled:cursor-default ${
    selected
      ? 'border-green text-green'
      : 'border-elevated text-secondary hover:border-secondary hover:text-primary'
  }`}
>
```

Pass `atCap` from `GoalscorerPicker` to both `<TeamSection>` calls:

```jsx
const atCap = selectedScorers.length >= maxScorers;

<TeamSection
  teamName={homeSquad?.team ?? 'Local'}
  players={homePlayers}
  scorerCounts={scorerCounts}
  onAdd={addScorer}
  onRemove={removeOne}
  disabled={disabled}
  atCap={atCap}
/>

<TeamSection
  teamName={awaySquad?.team ?? 'Visitante'}
  players={awayPlayers}
  scorerCounts={scorerCounts}
  onAdd={addScorer}
  onRemove={removeOne}
  disabled={disabled}
  atCap={atCap}
/>
```

- [ ] **Step 6: Verify manually**

Run `npm run dev` inside `frontend/`. Open a scheduled match. Set score to 2-0. Confirm only 2 scorers can be added. Set score to 0-0. Confirm all scorer buttons are disabled. Change score to 1-1 with 2 scorers already selected, then reduce to 1-0 — confirm one scorer is auto-removed.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/PredictionPage.jsx frontend/src/components/GoalscorerPicker.jsx
git commit -m "feat: limit goalscorer picks to total predicted goals"
```

---

## Task 3: "Ranking chico" personal mini-leaderboard

### Part A — Backend route

**Files:**
- Modify: `backend/src/routes/leaderboard.js`
- Create: `backend/tests/leaderboard.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/leaderboard.test.js`:

```js
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

const PERSONAL_USERS = ['Joaquin', 'lucasgover', 'david123'];

let tokens = {};
let outsiderToken;

beforeAll(async () => {
  await db.query('DELETE FROM predictions');
  await db.query('DELETE FROM matches');
  await db.query('DELETE FROM users');

  // Register the 3 personal-ranking users
  for (const username of PERSONAL_USERS) {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'password123' });
    tokens[username] = res.body.token;
  }

  // Register an outsider
  const outsider = await request(app)
    .post('/api/auth/register')
    .send({ username: 'outsider', password: 'password123' });
  outsiderToken = outsider.body.token;

  // Insert a match BEFORE the cutoff date
  await db.query(
    `INSERT INTO matches (external_id, home_team, away_team, kickoff_at, status, stage)
     VALUES ('ext-old', 'A', 'B', '2026-06-23 12:00:00', 'finished', 'GROUP_STAGE')`
  );

  // Insert a match ON/AFTER the cutoff date
  await db.query(
    `INSERT INTO matches (external_id, home_team, away_team, kickoff_at, status, stage)
     VALUES ('ext-new', 'C', 'D', '2026-06-24 12:00:00', 'finished', 'GROUP_STAGE')`
  );

  const oldMatch = await db.query("SELECT id FROM matches WHERE external_id = 'ext-old'");
  const newMatch = await db.query("SELECT id FROM matches WHERE external_id = 'ext-new'");
  const oldId = oldMatch.rows[0].id;
  const newId = newMatch.rows[0].id;

  const joaquin = await db.query("SELECT id FROM users WHERE username = 'Joaquin'");
  const joaquinId = joaquin.rows[0].id;

  // Joaquin has 10 pts from OLD match (should NOT count) and 5 pts from NEW match (should count)
  await db.query(
    `INSERT INTO predictions (user_id, match_id, predicted_home, predicted_away, points_earned)
     VALUES ($1, $2, 1, 0, 10)`,
    [joaquinId, oldId]
  );
  await db.query(
    `INSERT INTO predictions (user_id, match_id, predicted_home, predicted_away, points_earned)
     VALUES ($1, $2, 2, 1, 5)`,
    [joaquinId, newId]
  );
});

afterAll(async () => {
  await db.pool.end();
});

describe('GET /api/leaderboard/personal', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/leaderboard/personal');
    expect(res.status).toBe(401);
  });

  it('returns 403 if requesting user is not in the personal list', async () => {
    const res = await request(app)
      .get('/api/leaderboard/personal')
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(res.status).toBe(403);
  });

  it('returns only the 3 users with points from matches on/after 2026-06-24', async () => {
    const res = await request(app)
      .get('/api/leaderboard/personal')
      .set('Authorization', `Bearer ${tokens['Joaquin']}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);

    const joaquin = res.body.find((e) => e.username === 'Joaquin');
    expect(joaquin).toBeDefined();
    expect(joaquin.total_points).toBe(5); // only new match counts, not old match's 10 pts
    expect(joaquin.matches_predicted).toBe(1);

    const luca = res.body.find((e) => e.username === 'lucasgover');
    expect(luca.total_points).toBe(0); // no predictions from new match

    // All 3 are present
    const usernames = res.body.map((e) => e.username);
    expect(usernames).toEqual(expect.arrayContaining(PERSONAL_USERS));
  });

  it('response has rank, id, username, avatar_color, total_points, matches_predicted', async () => {
    const res = await request(app)
      .get('/api/leaderboard/personal')
      .set('Authorization', `Bearer ${tokens['Joaquin']}`);
    const entry = res.body[0];
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('username');
    expect(entry).toHaveProperty('avatar_color');
    expect(entry).toHaveProperty('total_points');
    expect(entry).toHaveProperty('matches_predicted');
    expect(entry).toHaveProperty('rank');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd backend && npm test -- tests/leaderboard.test.js
```

Expected: FAIL — `Cannot GET /api/leaderboard/personal` (route doesn't exist yet).

- [ ] **Step 3: Add the route to leaderboard.js**

In `backend/src/routes/leaderboard.js`, add after the existing `router.get('/', ...)` block and before `module.exports`:

```js
const PERSONAL_USERS = ['Joaquin', 'lucasgover', 'david123'];
const PERSONAL_START_DATE = '2026-06-24';

router.get('/personal', authMiddleware, async (req, res) => {
  if (!PERSONAL_USERS.includes(req.user.username)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
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
       LEFT JOIN predictions p
         ON p.user_id = u.id
         AND p.match_id IN (
           SELECT id FROM matches WHERE kickoff_at >= $1
         )
       WHERE u.username = ANY($2)
       GROUP BY u.id, u.username, u.avatar_color
       ORDER BY total_points DESC, u.username ASC`,
      [PERSONAL_START_DATE, PERSONAL_USERS]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd backend && npm test -- tests/leaderboard.test.js
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/leaderboard.js backend/tests/leaderboard.test.js
git commit -m "feat: add GET /leaderboard/personal for ranking chico"
```

---

### Part B — Frontend "Ranking chico" block

**Files:**
- Modify: `frontend/src/pages/LeaderboardPage.jsx`

- [ ] **Step 6: Add personal ranking fetch and state**

In `LeaderboardPage.jsx`, replace the current component with:

```jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const PERSONAL_USERS = ['Joaquin', 'lucasgover', 'david123'];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [personalEntries, setPersonalEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isPersonalUser = PERSONAL_USERS.includes(currentUser.username);

  useEffect(() => {
    const fetches = [api.get('/leaderboard')];
    if (isPersonalUser) fetches.push(api.get('/leaderboard/personal'));

    Promise.all(fetches).then(([main, personal]) => {
      setEntries(main);
      if (personal) setPersonalEntries(personal);
      setLoading(false);
    });
  }, [isPersonalUser]);

  if (loading) {
    return <div className="text-secondary text-sm">Cargando ranking...</div>;
  }

  const myEntry = entries.find((e) => e.id === currentUser.id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ranking</h1>

      {isPersonalUser && personalEntries && (
        <div className="mb-8">
          <p className="text-secondary text-xs uppercase tracking-wider mb-3">
            Ranking chico · desde 24 jun
          </p>
          <div className="space-y-0">
            {personalEntries.map((entry) => {
              const isMe = entry.id === currentUser.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between py-3 border-b border-elevated ${
                    isMe ? 'border-green' : ''
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
                    <span className={`text-sm ${isMe ? 'font-medium' : ''}`}>
                      {entry.username}
                    </span>
                    {isMe && <span className="text-secondary text-xs">Vos</span>}
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
      )}

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
          const isLeader = entry.rank === 1;
          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between py-3 border-b border-elevated ${
                isMe ? 'opacity-30' : ''
              } ${isLeader ? 'bg-yellow/5' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs w-6 text-right ${isLeader ? 'text-yellow' : 'text-secondary'}`}>
                  #{entry.rank}
                </span>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.avatar_color }}
                />
                <span className="text-sm">{entry.username}</span>
                {isLeader && <span className="text-base leading-none">👑</span>}
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

- [ ] **Step 7: Verify manually**

Run `npm run dev` inside `frontend/`. Log in as a user NOT in `['Joaquin', 'lucasgover', 'david123']`. Confirm no "Ranking chico" block appears. Log in as `Joaquin` (or one of the 3). Confirm the "Ranking chico" block appears above the main ranking showing only those 3 users.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/LeaderboardPage.jsx
git commit -m "feat: show ranking chico block for personal users"
```
