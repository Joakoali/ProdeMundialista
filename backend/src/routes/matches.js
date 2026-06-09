const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { fetchTeamSquad } = require('../services/footballApi');

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

router.get('/:id/squads', authMiddleware, async (req, res) => {
  try {
    const matchResult = await db.query(
      'SELECT home_team, away_team, home_team_id, away_team_id FROM matches WHERE id = $1',
      [req.params.id]
    );
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }
    const { home_team, away_team, home_team_id, away_team_id } = matchResult.rows[0];

    if (!home_team_id || !away_team_id) {
      return res.json({ home: { team: home_team, players: [] }, away: { team: away_team, players: [] } });
    }

    const [homePlayers, awayPlayers] = await Promise.all([
      fetchTeamSquad(home_team_id),
      fetchTeamSquad(away_team_id),
    ]);

    res.json({
      home: { team: home_team, players: homePlayers },
      away: { team: away_team, players: awayPlayers },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
