const cron = require('node-cron');
const { syncMatches } = require('./services/syncMatches');

cron.schedule('*/5 * * * *', async () => {
  console.log('[cron] Syncing matches...');
  await syncMatches();
});

console.log('[cron] Match sync scheduled (every 5 minutes)');
