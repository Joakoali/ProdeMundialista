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
