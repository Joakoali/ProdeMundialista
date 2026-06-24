const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

const PERSONAL_USERS = ['Joaquin', 'lucasgover', 'david123'];

let tokens = {};
let outsiderToken;

beforeAll(async () => {
  await db.query('DELETE FROM predictions');
  await db.query('DELETE FROM matches');
  await db.query('DELETE FROM users');

  // Register the 3 personal-ranking users
  for (const username of PERSONAL_USERS) {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'password123' });
    tokens[username] = res.body.token;
  }

  // Register an outsider
  const outsider = await request(app)
    .post('/api/auth/register')
    .send({ username: 'outsider', password: 'password123' });
  outsiderToken = outsider.body.token;

  // Insert a match BEFORE the cutoff date
  await db.query(
    `INSERT INTO matches (external_id, home_team, away_team, kickoff_at, status, stage)
     VALUES ('ext-old', 'A', 'B', '2026-06-23 12:00:00', 'finished', 'GROUP_STAGE')`
  );

  // Insert a match ON/AFTER the cutoff date
  await db.query(
    `INSERT INTO matches (external_id, home_team, away_team, kickoff_at, status, stage)
     VALUES ('ext-new', 'C', 'D', '2026-06-24 12:00:00', 'finished', 'GROUP_STAGE')`
  );

  const oldMatch = await db.query("SELECT id FROM matches WHERE external_id = 'ext-old'");
  const newMatch = await db.query("SELECT id FROM matches WHERE external_id = 'ext-new'");
  const oldId = oldMatch.rows[0].id;
  const newId = newMatch.rows[0].id;

  const joaquin = await db.query("SELECT id FROM users WHERE username = 'Joaquin'");
  const joaquinId = joaquin.rows[0].id;

  // Joaquin has 10 pts from OLD match (should NOT count) and 5 pts from NEW match (should count)
  await db.query(
    `INSERT INTO predictions (user_id, match_id, predicted_home, predicted_away, points_earned)
     VALUES ($1, $2, 1, 0, 10)`,
    [joaquinId, oldId]
  );
  await db.query(
    `INSERT INTO predictions (user_id, match_id, predicted_home, predicted_away, points_earned)
     VALUES ($1, $2, 2, 1, 5)`,
    [joaquinId, newId]
  );
});

afterAll(async () => {
  await db.pool.end();
});

describe('GET /api/leaderboard/personal', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/leaderboard/personal');
    expect(res.status).toBe(401);
  });

  it('returns 403 if requesting user is not in the personal list', async () => {
    const res = await request(app)
      .get('/api/leaderboard/personal')
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(res.status).toBe(403);
  });

  it('returns only the 3 users with points from matches on/after 2026-06-24', async () => {
    const res = await request(app)
      .get('/api/leaderboard/personal')
      .set('Authorization', `Bearer ${tokens['Joaquin']}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);

    const joaquin = res.body.find((e) => e.username === 'Joaquin');
    expect(joaquin).toBeDefined();
    expect(joaquin.total_points).toBe(5); // only new match counts, not old match's 10 pts
    expect(joaquin.matches_predicted).toBe(1);

    const luca = res.body.find((e) => e.username === 'lucasgover');
    expect(luca.total_points).toBe(0); // no predictions from new match

    // All 3 are present
    const usernames = res.body.map((e) => e.username);
    expect(usernames).toEqual(expect.arrayContaining(PERSONAL_USERS));
  });

  it('response has rank, id, username, avatar_color, total_points, matches_predicted', async () => {
    const res = await request(app)
      .get('/api/leaderboard/personal')
      .set('Authorization', `Bearer ${tokens['Joaquin']}`);
    const entry = res.body[0];
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('username');
    expect(entry).toHaveProperty('avatar_color');
    expect(entry).toHaveProperty('total_points');
    expect(entry).toHaveProperty('matches_predicted');
    expect(entry).toHaveProperty('rank');
  });
});
