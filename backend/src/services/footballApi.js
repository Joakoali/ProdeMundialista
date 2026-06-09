const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY },
  timeout: 10000,
});

// Cache squad data per team to avoid hitting rate limits (24h TTL)
const squadCache = new Map();
const SQUAD_CACHE_TTL = 24 * 60 * 60 * 1000;

async function fetchWorldCupMatches() {
  const res = await client.get('/competitions/WC/matches');
  return res.data.matches;
}

async function fetchMatchDetail(externalId) {
  const res = await client.get(`/matches/${externalId}`);
  return res.data;
}

async function fetchTeamSquad(teamId) {
  const cached = squadCache.get(teamId);
  if (cached && Date.now() - cached.fetchedAt < SQUAD_CACHE_TTL) {
    return cached.players;
  }
  const res = await client.get(`/teams/${teamId}`);
  const players = (res.data.squad || []).map(p => p.name);
  squadCache.set(teamId, { players, fetchedAt: Date.now() });
  return players;
}

module.exports = { fetchWorldCupMatches, fetchMatchDetail, fetchTeamSquad };
