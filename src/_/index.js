const env = require('./env');
const nats = require('./nats');
const log = require('./log');
const proc = require('./proc');
const db = require('./db');
const services = require('../services');
const router = require('./router');
const strings = require('./strings');

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

module.exports.isHttp = (message) => message.application.from === 'gateway';
module.exports.receive = nats.receive
module.exports.send = nats.send
module.exports.reply = nats.reply
module.exports.replyError = nats.replyError
module.exports.e = env.get
module.exports.db = db.db
module.exports.request = nats.request;
module.exports.router = router;
module.exports.maskSensitive = log.maskSensitive;
module.exports.services = services;
module.exports.strings = strings;
module.exports.id = db._id;