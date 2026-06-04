const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

beforeEach(async () => {
  await db.query('DELETE FROM users');
});

afterAll(async () => {
  await db.pool.end();
});

describe('POST /api/auth/register', () => {
  it('creates user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects duplicate username', async () => {
    await request(app).post('/api/auth/register').send({ username: 'testuser', password: 'pass123' });
    const res = await request(app).post('/api/auth/register').send({ username: 'testuser', password: 'pass456' });
    expect(res.status).toBe(409);
  });

  it('rejects short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'user2', password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({ username: 'loginuser', password: 'mypassword' });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'loginuser', password: 'mypassword' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'loginuser', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown username', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'pass' });
    expect(res.status).toBe(401);
  });
});
