const nats = require('./nats');
const db = require('./db');
const log = require('./log');

let closing = false;

const closeAll = async (signal) => {
  if (closing) return;
  closing = true;
  log.log('shuthdown', 'closeAll', { signal });
  await nats.close();
  await db.close();
  process.exit(0);
};

process.on('SIGINT', async () => await closeAll('SIGINT'));
process.on('SIGTERM', async () => await closeAll('SIGTERM'));
process.on('SIGUSR2', async () => await closeAll('SIGUSR2'));
process.on('exit', async () => await closeAll('exit'));