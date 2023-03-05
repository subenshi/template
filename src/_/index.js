const env = require('./env');
const nats = require('./nats');
const log = require('./log');
const proc = require('./proc');
const db = require('./db');

/**
 * Connects to the different servers dependencies, 
 * depending on the availability of its environment variables
 * @param {*} cb 
 */
module.exports.connect = async (cb) => {
  await nats.connect();
  await db.connect();
  cb();
}

module.exports.receive = nats.receive
module.exports.send = nats.send
module.exports.reply = nats.reply
module.exports.e = env.get
module.exports.db = db.db
module.exports.request = nats.request;
module.exports.maskSensitive = log.maskSensitive;