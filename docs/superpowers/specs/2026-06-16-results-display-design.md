# Results Display — Design Spec
Date: 2026-06-16

## Goal
Show the actual match result prominently in the existing green (`#00C896`) in two places: the MatchCard list and the PredictionPage detail. Also show a goalscorer accuracy badge when applicable.

## Data available (no backend changes needed)
- `match.home_score`, `match.away_score` — final score
- `match.home_scorers`, `match.away_scorers` — arrays of scorer names
- `prediction.predicted_home`, `prediction.predicted_away` — user's predicted score
- `prediction.predicted_scorers` — array of predicted scorer names
- `prediction.points_earned` — total points awarded
- All fields already returned by `GET /matches` and `GET /matches/:id`

## Goalscorer badge logic
Computed client-side by comparing `predicted_scorers` against `home_scorers + away_scorers`:
- Count how many predicted scorers appear in the actual scorer list (capped by occurrences, matching `scoring.js` logic)
- Badge text: `X/Y goleadores`
- Only render the badge if `predicted_scorers.length > 0`
- If the match has no scorer data, treat actual scorers as empty (badge shows `0/Y goleadores`)

## MatchCard changes
Applies when `match.status === 'finished'` and the user has a prediction (`predicted_home` is not null).

Layout addition — a second line below the team names row:
- Left side: `Tu pred: X–Y` in `text-secondary text-xs`
- Right side: actual score `X–Y` in `text-green font-bold text-sm`, then `+N pts` in `text-green text-sm font-bold`
- Below actual score (right-aligned, small): goalscorer badge `X/Y goleadores` in `text-green text-xs` — only if user predicted scorers

The existing `+{points_earned}` display in the right column is replaced by this new layout (it already shows points, just restructured).

## PredictionPage changes
Applies when `matchData.status === 'finished'`.

Replace the current one-liner ("Resultado final: X–Y +N pts") with a dedicated result block rendered between the match header and the (disabled/opaque) score picker section:

```
Resultado final
  [home_score]  –  [away_score]        ← text-green text-3xl font-bold, centered
Tu predicción: X–Y                     ← text-secondary text-xs, centered
X/Y goleadores  ·  +N pts             ← text-green text-xs, centered (goalscorer part omitted if no predicted scorers)
```

No border, no background — relies on green-on-dark contrast. No animation needed.

## Out of scope
- Backend changes (all data already exists)
- Per-player goalscorer breakdown (badge summary only)
- Color changes (using existing `green` token)
- Live match state display changes
