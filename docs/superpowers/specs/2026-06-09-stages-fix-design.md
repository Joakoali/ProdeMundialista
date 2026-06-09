# Stage Filter Fix — Mundial 2026 Format

## Problem

The frontend `STAGES` array in `HomePage.jsx` used stage keys that don't match what football-data.org v4 actually returns for the 2026 World Cup. Two existing filters were silently broken, and the new Round of 32 phase was missing entirely.

## Root Cause

The football-data.org API returns these stage keys for WC 2026:
`GROUP_STAGE`, `LAST_32`, `LAST_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `THIRD_PLACE`, `FINAL`

The frontend had `ROUND_OF_16` instead of `LAST_16`, causing the Octavos filter to never match any matches. There was no `LAST_32` entry (16avos) and no `THIRD_PLACE` entry.

The backend sync (`syncMatches.js`) stores `apiMatch.stage` verbatim, so the database already holds the correct keys — the bug was frontend-only.

## Fix

Single file change: `frontend/src/pages/HomePage.jsx` — update the `STAGES` constant.

### Before

```js
const STAGES = [
  { key: 'ALL', label: 'Todos' },
  { key: 'GROUP_STAGE', label: 'Grupos' },
  { key: 'ROUND_OF_16', label: 'Octavos' },
  { key: 'QUARTER_FINALS', label: 'Cuartos' },
  { key: 'SEMI_FINALS', label: 'Semis' },
  { key: 'FINAL', label: 'Final' },
];
```

### After

```js
const STAGES = [
  { key: 'ALL',           label: 'Todos' },
  { key: 'GROUP_STAGE',   label: 'Grupos' },
  { key: 'LAST_32',       label: '16avos' },
  { key: 'LAST_16',       label: 'Octavos' },
  { key: 'QUARTER_FINALS', label: 'Cuartos' },
  { key: 'SEMI_FINALS',   label: 'Semis' },
  { key: 'THIRD_PLACE',   label: '3er puesto' },
  { key: 'FINAL',         label: 'Final' },
];
```

## Scope

- No backend changes
- No database changes
- No new components
- No routing changes
