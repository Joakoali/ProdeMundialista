const db = require('../db');
const { fetchWorldCupMatches, fetchMatchDetail } = require('./footballApi');
const { calculatePoints } = require('./scoring');

const STATUS_MAP = {
  SCHEDULED: 'scheduled',
  TIMED: 'scheduled',
  IN_PLAY: 'live',
  PAUSED: 'live',
  FINISHED: 'finished',
  POSTPONED: 'scheduled',
  SUSPENDED: 'scheduled',
  CANCELLED: 'scheduled',
};

async function syncMatches() {
  try {
    const apiMatches = await fetchWorldCupMatches();
    for (const apiMatch of apiMatches) {
      await upsertMatch(apiMatch);
    }
    console.log(`[sync] ${apiMatches.length} matches processed`);
  } catch (err) {
    console.error('[sync] Error:', err.message);
  }
}

async function upsertMatch(apiMatch) {
  // Skip knockout matches where teams haven't been determined yet
  if (!apiMatch.homeTeam.name && !apiMatch.homeTeam.shortName) return;

  const status = STATUS_MAP[apiMatch.status] || 'scheduled';
  const externalId = String(apiMatch.id);

  const existing = await db.query(
    'SELECT * FROM matches WHERE external_id = $1',
    [externalId]
  );

  if (existing.rows.length === 0) {
    await db.query(
      `INSERT INTO matches (external_id, home_team, away_team, kickoff_at, status, stage, home_team_id, away_team_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        externalId,
        apiMatch.homeTeam.shortName || apiMatch.homeTeam.name,
        apiMatch.awayTeam.shortName || apiMatch.awayTeam.name,
        apiMatch.utcDate,
        status,
        apiMatch.stage || 'GROUP_STAGE',
        String(apiMatch.homeTeam.id),
        String(apiMatch.awayTeam.id),
      ]
    );
    return;
  }

  const match = existing.rows[0];

  if (match.status === status && status !== 'finished') return;

  if (status === 'live' && match.status === 'scheduled') {
    await db.query(
      `UPDATE predictions SET locked_at = NOW()
       WHERE match_id = $1 AND locked_at IS NULL`,
      [match.id]
    );
    await db.query(
      'UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2',
      ['live', match.id]
    );
    return;
  }

  if (status === 'finished' && match.status !== 'finished') {
    const detail = await fetchMatchDetail(apiMatch.id);
    const homeTeamId = apiMatch.homeTeam.id;

    const homeScorers = (detail.goals || [])
      .filter(g => g.team.id === homeTeamId && g.type !== 'OWN')
      .map(g => g.scorer.name);
    const awayScorers = (detail.goals || [])
      .filter(g => g.team.id !== homeTeamId && g.type !== 'OWN')
      .map(g => g.scorer.name);

    await db.query(
      `UPDATE matches
       SET status = 'finished',
           home_score = $1,
           away_score = $2,
           home_scorers = $3,
           away_scorers = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [
        apiMatch.score.fullTime.home,
        apiMatch.score.fullTime.away,
        JSON.stringify(homeScorers),
        JSON.stringify(awayScorers),
        match.id,
      ]
    );

    await scoreAllPredictions(match.id, {
      home_score: apiMatch.score.fullTime.home,
      away_score: apiMatch.score.fullTime.away,
      home_scorers: homeScorers,
      away_scorers: awayScorers,
    });
    return;
  }

  if (match.status === 'finished') return;

  await db.query(
    'UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, match.id]
  );
}

async function scoreAllPredictions(matchId, matchResult) {
  const preds = await db.query(
    'SELECT * FROM predictions WHERE match_id = $1',
    [matchId]
  );
  for (const pred of preds.rows) {
    const points = calculatePoints(pred, matchResult);
    await db.query(
      'UPDATE predictions SET points_earned = $1 WHERE id = $2',
      [points, pred.id]
    );
  }
}

module.exports = { syncMatches };
