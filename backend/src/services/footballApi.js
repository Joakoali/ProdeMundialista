const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY },
  timeout: 10000,
});

async function fetchWorldCupMatches() {
  const res = await client.get('/competitions/WC/matches');
  return res.data.matches;
}

async function fetchMatchDetail(externalId) {
  const res = await client.get(`/matches/${externalId}`);
  return res.data;
}

module.exports = { fetchWorldCupMatches, fetchMatchDetail };
