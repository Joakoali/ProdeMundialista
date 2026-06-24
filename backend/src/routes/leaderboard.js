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

const PERSONAL_USERS = ['Joaquin', 'lucasgover', 'david123'];
const PERSONAL_START_DATE = '2026-06-24';

router.get('/personal', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query('SELECT username FROM users WHERE id = $1', [req.userId]);
    if (!userRes.rows.length || !PERSONAL_USERS.includes(userRes.rows[0].username)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
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

module.exports = router;
