const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

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

module.exports = router;
