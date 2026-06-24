# Design: Three UX Features
Date: 2026-06-24

## Feature 1 — Redirect after saving prediction

**Goal:** After a user saves their prediction, send them back to the match list instead of staying on the prediction page.

**Behavior:**
- On successful save, show the green tick "✓ Predicción guardada" for 1.5 seconds.
- Then call `navigate('/')` automatically.
- No new state needed — replace `setTimeout(() => setSaved(false), 2500)` with `setTimeout(() => navigate('/'), 1500)`.

**Files touched:** `frontend/src/pages/PredictionPage.jsx`

---

## Feature 2 — Goalscorer count limited by total goals

**Goal:** Users can only select as many goalscorers as total goals predicted (homeScore + awayScore). If the score is 2-0, max 2 scorers. If score is 0-0, 0 scorers allowed.

**Behavior:**
- `totalGoals = homeScore + awayScore`
- When `homeScore` or `awayScore` changes and `scorers.length > totalGoals`, auto-trim scorers from the end: `scorers.slice(0, totalGoals)`.
- `GoalscorerPicker` receives a `maxScorers` prop. The add action is disabled when `selectedScorers.length >= maxScorers`.
- Header of the picker shows a counter: `Goleadores (1/2)` so the user knows the cap.

**Files touched:**
- `frontend/src/pages/PredictionPage.jsx` — add `useEffect` for score-change trimming, pass `maxScorers` prop.
- `frontend/src/components/GoalscorerPicker.jsx` — receive and enforce `maxScorers`, show counter.

---

## Feature 3 — "Ranking chico" (personal ranking from today)

**Goal:** A mini-ranking visible only to 3 specific users, counting points earned only from matches with `kickoff_at >= 2026-06-24`. One user joined late and the full leaderboard wouldn't be fair for them.

**Users:** `Joaquin`, `lucasgover`, `david123` (hardcoded, case-sensitive).
**Start date:** `2026-06-24` (hardcoded).

**Backend:**
- New route `GET /leaderboard/personal` (auth required).
- Query filters predictions by `matches.kickoff_at >= '2026-06-24'` and users in the hardcoded list.
- Returns same shape as `/leaderboard`: `[{ id, username, avatar_color, total_points, matches_predicted, rank }]`.
- Returns 403 if the requesting user is not one of the 3.

**Frontend:**
- In `LeaderboardPage`, call `/leaderboard/personal` in addition to `/leaderboard`.
- If the logged-in user is one of the 3, render a block above the main ranking titled **"Ranking chico"** showing the 3 users with their points from the start date.
- If the user is not one of the 3, the block is not shown and the extra API call is skipped.

**Files touched:**
- `backend/src/routes/leaderboard.js` — add `router.get('/personal', ...)`.
- `frontend/src/pages/LeaderboardPage.jsx` — conditional fetch + render of "Ranking chico" block.
