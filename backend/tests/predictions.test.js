const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

let token;
let matchId;

beforeAll(async () => {
  await db.query('DELETE FROM predictions');
  await db.query('DELETE FROM matches');
  await db.query('DELETE FROM users');

  const reg = await request(app)
    .post('/api/auth/register')
    .send({ username: 'preduser', password: 'password123' });
  token = reg.body.token;

  const match = await db.query(
    `INSERT INTO matches (external_id, home_team, away_team, kickoff_at, status, stage)
     VALUES ('ext-999', 'Argentina', 'Brazil', NOW() + interval '1 hour', 'scheduled', 'GROUP_STAGE')
     RETURNING id`
  );
  matchId = match.rows[0].id;
});

afterAll(async () => {
  await db.pool.end();
});

describe('POST /api/predictions', () => {
  it('creates a prediction', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ match_id: matchId, predicted_home: 2, predicted_away: 1, predicted_scorers: ['Messi'] });
    expect(res.status).toBe(201);
    expect(res.body.predicted_home).toBe(2);
  });

  it('updates existing prediction (upsert)', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ match_id: matchId, predicted_home: 3, predicted_away: 0 });
    expect(res.status).toBe(201);
    expect(res.body.predicted_home).toBe(3);
  });

  it('rejects prediction on live match', async () => {
    await db.query("UPDATE matches SET status = 'live' WHERE id = $1", [matchId]);
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ match_id: matchId, predicted_home: 1, predicted_away: 1 });
    expect(res.status).toBe(403);
    await db.query("UPDATE matches SET status = 'scheduled' WHERE id = $1", [matchId]);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .send({ match_id: matchId, predicted_home: 1, predicted_away: 0 });
    expect(res.status).toBe(401);
  });
});
