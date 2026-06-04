const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { match_id, predicted_home, predicted_away, predicted_scorers = [] } = req.body;

  if (!match_id || predicted_home === undefined || predicted_away === undefined) {
    return res.status(400).json({
      message: 'match_id, predicted_home, and predicted_away are required',
    });
  }
  if (predicted_home < 0 || predicted_away < 0) {
    return res.status(400).json({ message: 'Scores cannot be negative' });
  }

  try {
    const matchResult = await db.query(
      'SELECT id, status FROM matches WHERE id = $1',
      [match_id]
    );
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }
    if (matchResult.rows[0].status !== 'scheduled') {
      return res.status(403).json({ message: 'Match has already started — predictions are locked' });
    }

    const result = await db.query(
      `INSERT INTO predictions
         (user_id, match_id, predicted_home, predicted_away, predicted_scorers, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, match_id) DO UPDATE
         SET predicted_home = $3,
             predicted_away = $4,
             predicted_scorers = $5,
             updated_at = NOW()
       RETURNING *`,
      [req.userId, match_id, predicted_home, predicted_away, JSON.stringify(predicted_scorers)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
