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
