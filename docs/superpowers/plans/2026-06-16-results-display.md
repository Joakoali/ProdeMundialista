# Results Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the actual match result in green prominently in both MatchCard and PredictionPage, plus a goalscorer accuracy badge when the user predicted scorers.

**Architecture:** Add a shared `goalscorerBadge()` helper in `lib/scorers.js` that computes the `X/Y goleadores` string. MatchCard gets a restructured right-side column for finished matches. PredictionPage replaces its one-liner result text with a centered result block. No backend changes — all needed data (`home_score`, `away_score`, `home_scorers`, `away_scorers`, `predicted_scorers`, `points_earned`) is already returned by existing endpoints.

**Tech Stack:** React 18, Tailwind CSS (custom tokens: `text-green` = `#00C896`, `text-secondary` = `#666666`), Vite dev server (`npm run dev` in `frontend/`)

---

### Task 1: Create goalscorer badge helper

**Files:**
- Create: `frontend/src/lib/scorers.js`

- [ ] **Step 1: Create `frontend/src/lib/scorers.js`**

```js
function countOccurrences(arr) {
  return arr.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
}

export function goalscorerBadge(predictedScorers, homeScorers, awayScorers) {
  if (!predictedScorers || predictedScorers.length === 0) return null;
  const actual = countOccurrences([...(homeScorers || []), ...(awayScorers || [])]);
  const predicted = countOccurrences(predictedScorers);
  let hits = 0;
  for (const [player, count] of Object.entries(predicted)) {
    hits += Math.min(count, actual[player] || 0);
  }
  return `${hits}/${predictedScorers.length} goleadores`;
}
```

Logic mirrors `backend/src/services/scoring.js`: for each predicted player, count how many of their predictions hit (capped by actual occurrences). Returns `null` when no scorers predicted (so callers can conditionally render).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/scorers.js
git commit -m "feat: add goalscorerBadge helper"
```

---

### Task 2: Update MatchCard to show actual result

**Files:**
- Modify: `frontend/src/components/MatchCard.jsx`

**Context:** The right-side column currently uses a flat `flex items-center` row. For finished matches we need a two-row column (score row + optional badge row), so we switch the wrapper to `flex-col items-end`.

- [ ] **Step 1: Replace `frontend/src/components/MatchCard.jsx` with the following**

```jsx
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';
import { formatDate } from '../lib/utils';
import { goalscorerBadge } from '../lib/scorers';

export default function MatchCard({ match }) {
  const navigate = useNavigate();
  const isPredicted = match.predicted_home !== null && match.predicted_home !== undefined;
  const isLocked = match.status !== 'scheduled';
  const isDimmed = match.status === 'finished';
  const isPending = match.status === 'scheduled' && !isPredicted;
  const isFinished = match.status === 'finished';

  const scorerBadge =
    isFinished && isPredicted
      ? goalscorerBadge(match.predicted_scorers, match.home_scorers, match.away_scorers)
      : null;

  return (
    <motion.div
      whileHover={!isLocked ? { backgroundColor: '#1A1A1A' } : {}}
      onClick={() => navigate(`/match/${match.id}`)}
      className={`relative border-b border-elevated py-4 cursor-pointer transition-colors ${
        isDimmed ? 'opacity-50' : ''
      }`}
    >
      {isPending && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green" />
      )}
      <div className={`flex items-center justify-between ${isPending ? 'pl-3' : ''}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm truncate">{match.home_team}</span>
            <span className="text-secondary text-xs flex-shrink-0">vs</span>
            <span className="font-bold text-sm truncate">{match.away_team}</span>
          </div>
          <span className="text-secondary text-xs">{formatDate(match.kickoff_at)}</span>
        </div>

        <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-4">
          <div className="flex items-center gap-2">
            {isPredicted && (
              <span className="text-secondary text-xs tabular-nums">
                {match.predicted_home}–{match.predicted_away}
              </span>
            )}
            {isFinished && match.home_score != null && (
              <span className="text-green font-bold text-sm tabular-nums">
                {match.home_score}–{match.away_score}
              </span>
            )}
            {isFinished && match.points_earned != null && (
              <span className="text-green text-xs font-bold">
                +{match.points_earned}
              </span>
            )}
            <Badge status={match.status} />
          </div>
          {scorerBadge && (
            <span className="text-green text-xs">{scorerBadge}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Start dev server and verify MatchCard visually**

```bash
cd frontend && npm run dev
```

Open the home page. For a **finished** match with a prediction:
- Right side should show: predicted score in grey, actual score in green, +pts in green, [FIN] badge
- If the user predicted scorers: a `X/Y goleadores` line in green below

For a **scheduled** match: no change from current behavior.
For a **live** match: no change from current behavior.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/MatchCard.jsx
git commit -m "feat: show actual result and goalscorer badge in MatchCard"
```

---

### Task 3: Update PredictionPage result block

**Files:**
- Modify: `frontend/src/pages/PredictionPage.jsx`

**Context:** The existing one-liner `<p>Resultado final: X–Y +N pts</p>` lives between the match header and the score picker (which is wrapped in an `opacity-50` div when locked). Replace it with a centered result block. The `scorerBadge` is computed once and used only if truthy.

The `matchData` object for a finished match looks like:
```json
{
  "status": "finished",
  "home_score": 2,
  "away_score": 1,
  "home_scorers": ["Messi", "Di María"],
  "away_scorers": ["Mbappé"],
  "prediction": {
    "predicted_home": 1,
    "predicted_away": 0,
    "predicted_scorers": ["Messi", "Mbappé"],
    "points_earned": 3
  }
}
```

- [ ] **Step 1: Replace `frontend/src/pages/PredictionPage.jsx` with the following**

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import ScorePicker from '../components/ScorePicker';
import GoalscorerPicker from '../components/GoalscorerPicker';
import Badge from '../components/ui/Badge';
import { formatDate } from '../lib/utils';
import { goalscorerBadge } from '../lib/scorers';

export default function PredictionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [squads, setSquads] = useState(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [scorers, setScorers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/matches/${id}`),
      api.get(`/matches/${id}/squads`),
    ])
      .then(([matchRes, squadsRes]) => {
        setMatchData(matchRes);
        setSquads(squadsRes);
        if (matchRes.prediction) {
          setHomeScore(matchRes.prediction.predicted_home);
          setAwayScore(matchRes.prediction.predicted_away);
          setScorers(matchRes.prediction.predicted_scorers || []);
        }
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar el partido');
      });
  }, [id]);

  if (!matchData && !error) {
    return <div className="text-secondary text-sm">Cargando...</div>;
  }

  if (error && !matchData) {
    return <div className="text-red text-sm">{error}</div>;
  }

  const isLocked = matchData.status !== 'scheduled';
  const isFinished = matchData.status === 'finished';

  const scorerBadge = isFinished
    ? goalscorerBadge(
        matchData.prediction?.predicted_scorers,
        matchData.home_scorers,
        matchData.away_scorers
      )
    : null;

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

      {isFinished && (
        <div className="text-center mt-6 mb-4">
          <p className="text-secondary text-xs mb-1">Resultado final</p>
          <p className="text-green text-3xl font-bold tabular-nums">
            {matchData.home_score} – {matchData.away_score}
          </p>
          {matchData.prediction && (
            <p className="text-secondary text-xs mt-2">
              Tu predicción: {matchData.prediction.predicted_home}–{matchData.prediction.predicted_away}
            </p>
          )}
          {(scorerBadge || matchData.prediction?.points_earned != null) && (
            <p className="text-green text-xs mt-1">
              {[
                scorerBadge,
                matchData.prediction?.points_earned != null
                  ? `+${matchData.prediction.points_earned} pts`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
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
          homeSquad={squads?.home}
          awaySquad={squads?.away}
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

- [ ] **Step 2: Verify PredictionPage visually**

With the dev server running, open a finished match. Verify:
- Centered result block appears between the match header and the (dimmed) score picker
- Score in `text-green text-3xl font-bold` (large green numbers)
- "Tu predicción: X–Y" in small grey text below
- Points and/or goalscorer badge in small green text below that
- If no prediction was made: prediction line does not appear; points line does not appear
- If no scorers were predicted: badge does not appear, only `+N pts`
- Live match: result block does not appear, yellow "en juego" message still shows
- Scheduled match: no result block, form is interactive as before

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PredictionPage.jsx
git commit -m "feat: show result block with goalscorer badge in PredictionPage"
```
