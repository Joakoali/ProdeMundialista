# Prode Mundial 2026 — Design Spec

## Overview

A prediction web app for the 2026 FIFA World Cup. Users register, predict match results and goalscorers before kick-off, and compete on a global leaderboard. Match data is pulled automatically from football-data.org — no manual data entry required.

Target aesthetic: dark, minimal, precision-crafted — inspired by Trade Republic.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + React Router + Tailwind CSS |
| Backend | Node.js + Express (REST API) |
| Database | PostgreSQL |
| Auth | JWT (username + password) |
| External API | football-data.org (free tier) |
| Frontend deploy | Vercel |
| Backend + DB deploy | Railway (free tier) |

Design implementation uses `emil-design-eng` and related UI skills for component polish and micro-interactions.

---

## Data Model

### users
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| username | VARCHAR(50) | Unique |
| password_hash | TEXT | bcrypt |
| avatar_color | VARCHAR(7) | Hex color, generated at registration |
| created_at | TIMESTAMP | |

### matches
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| external_id | VARCHAR | football-data.org match ID |
| home_team | VARCHAR | |
| away_team | VARCHAR | |
| kickoff_at | TIMESTAMP | UTC |
| status | ENUM | scheduled / live / finished |
| home_score | INT | NULL until finished |
| away_score | INT | NULL until finished |
| home_scorers | JSONB | Array of player names |
| away_scorers | JSONB | Array of player names |
| stage | VARCHAR | Group / Round of 16 / etc. |

### predictions
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users |
| match_id | UUID | FK → matches |
| predicted_home | INT | |
| predicted_away | INT | |
| predicted_scorers | JSONB | Array of player names |
| points_earned | INT | NULL until match finished |
| locked_at | TIMESTAMP | Set when match goes live |
| updated_at | TIMESTAMP | Last edit before lock |

Leaderboard is a calculated view: `SUM(points_earned)` per user, ordered descending.

---

## Scoring System

Points are awarded once a match status becomes `finished`.

| Prediction | Points |
|---|---|
| Correct winner (wrong score) | 2 pts |
| Correct draw — wrong exact score (e.g. predicted 0-0, result was 1-1) | 3 pts |
| Exact result (including exact draws) | 5 pts |
| Each correct goalscorer | 1 pt per goal (always, regardless of result) |
| Exact result + goalscorers | goalscorer points ×2 (stacks with base result points) |

**Rules:**
- Exact result always scores 5 pts — this includes exact draws (predict 1-1, result is 1-1 = 5 pts, not 3).
- Correct draw (wrong score) means: predicted a draw but not the exact score (e.g. predicted 0-0, result was 2-2) = 3 pts.
- Goalscorer points always apply, even if the result prediction was wrong.
- The ×2 multiplier on goalscorer points only activates when the exact result is correct.
- A prediction can be edited any number of times until kick-off (`kickoff_at`). After that it is locked and read-only.

**Example:** Argentina 2-1 Brazil. Messi and Lautaro score.
- Predicted 2-1 + Messi + Lautaro → 5 + (2 × 2) = **9 pts**
- Predicted 1-0 + Messi + Lautaro → 2 (correct winner) + 2 (goalscorers, no multiplier) = **4 pts**
- Predicted 2-1, no scorers → **5 pts**
- Predicted 0-1 + Messi + Lautaro → 0 (wrong winner) + 2 (goalscorers) = **2 pts**

---

## Data Sync — football-data.org

A cron job runs every 5 minutes on the backend:

1. Fetches matches for the current day from football-data.org
2. Detects status changes (`scheduled → live → finished`) and updates the DB
3. When a match transitions to `live`: locks all predictions for that match (sets `locked_at`)
4. When a match transitions to `finished`: records final score + goalscorers, then calculates and writes `points_earned` for every prediction on that match

The cron job is non-blocking and runs independently of request handling.

**API notes:** football-data.org free tier provides match events including goalscorer data. Rate limit is 10 requests/minute — the 5-minute cron interval stays well within this.

---

## Screens

### 1. Auth
Single page for login and registration. Toggle between the two modes. Username + password only. Centered, dark, large typography. No social logins.

### 2. Home / Match Feed
- List of all World Cup matches ordered by date
- Each match card shows: home team, away team, kick-off time, status badge (Open / Live / Closed)
- If the user has an existing prediction, it's shown inline on the card
- Filter tabs by stage: All / Group Stage / Round of 16 / Quarter-finals / Semi-finals / Final
- Clicking a card opens the prediction screen

### 3. Prediction Screen
- Score picker: two large centered numbers (home / away) with + and − buttons. Stepper style, no free-text input
- Goalscorer section: both teams' squads listed as selectable chips. Tap to add a player as a predicted scorer; tap again to remove. Supports multi-goal predictions (tap same player multiple times = predicts they score twice)
- "Confirm" button saves/updates the prediction
- If match is locked (`status = live` or `finished`): entire screen is read-only, score and scorers shown as-is, "Closed" badge visible, inputs disabled at 50% opacity
- Predictions can be edited and resubmitted freely until kick-off

### 4. Leaderboard
- Global ranking table
- User's own row always pinned at the top of the visible area (even if ranked #47)
- Columns: rank, username, total points, matches predicted
- No pagination for MVP — load all users (suitable for expected scale)

### 5. My Profile
- List of past predictions with outcome: match, predicted score vs actual score, points earned
- Total points, total predictions made, correct results count

---

## UI / Design System

**Philosophy:** Emil Kowalski-style polish — every interaction has tactile feedback, numbers animate when changed, transitions are quick and purposeful. No decorative elements; every pixel earns its place.

**Color palette:**
| Token | Value | Usage |
|---|---|---|
| `bg-base` | `#0A0A0A` | Page background |
| `bg-surface` | `#1A1A1A` | Cards, panels |
| `bg-elevated` | `#242424` | Inputs, hover states |
| `text-primary` | `#FFFFFF` | Main text |
| `text-secondary` | `#666666` | Labels, metadata |
| `accent-green` | `#00C896` | CTA buttons, correct prediction, positive points |
| `accent-red` | `#FF4D4D` | Wrong result, errors |
| `accent-yellow` | `#F5A623` | Draw, pending state |

**Typography:** Inter or Geist. Score numbers: 700 weight, large. Labels: 400 weight, small caps.

**Component notes:**
- Match card: thin `1px` separator, no rounded corners (sharp, precise), teams in bold, time in `text-secondary`
- Score picker: no visible border box — just the numbers and minimal +/− buttons
- Leaderboard row: rank in `text-secondary`, username in white, points in `accent-green` right-aligned
- Locked prediction: full card at `opacity-50`, "Cerrado" badge in `text-secondary`
- Micro-interactions: score number does a brief scale-up (1.0 → 1.15 → 1.0) when incremented/decremented; confirmation button has a subtle press state

---

## Auth Flow

- JWT stored in `localStorage`
- Token expiry: 7 days
- Protected routes redirect to `/auth` if no valid token
- No password reset for MVP (can be added post-launch)

---

## Out of Scope (MVP)

- Groups / private leagues
- Push notifications / email reminders
- Password reset
- Social login (Google, GitHub)
- Admin panel
- Historical tournaments
- Mobile app (responsive web only)
