const { JSONCodec, connect } = require('nats')
const env = require('./env');
const log = require('./log');
const crypto = require('./crypto');
const package = require('./package');

let config;

// Check if config.json exists
try {
  config = require('../../config.json')
} catch (e) {
  config = {}
}

// to create a connection to a nats-server:
let nc

let autoDiscoverSetupRan = false

let inflightCount = 0

module.exports.inflightCount = () => inflightCount

module.exports.autoDiscoverSetup = () => {
  if (autoDiscoverSetupRan) return;
  autoDiscoverSetupRan = true;
  this.subscribe('nats.discovery.ping', () => {
    this.autoDiscover(true)
  })
}

module.exports.autoDiscover = (status) => {
  log.log('nats', 'autodiscover-status', { status })
  if (env.get('DISABLE_AUTODISCOVER')) return;
  this.autoDiscoverSetup();

  this.publish('nats.discovery', {
    name: package.name,
    version: package.version,
    config,
    status
  })
}

module.exports.connect = async () => {
  if (nc) return true;

  const connectionOptions = {
    servers: env.get('NATS_SERVER'),
    json: true,
  };

  log.log('nats', 'connecting', connectionOptions);

  nc = await connect(connectionOptions);

  nc.closed()
    .then((err) => {
      if (err) {
        console.error(`closed with an error: ${err.message}`);
      }
    });
  
  log.log('nats', 'connected');

  this.autoDiscover(true);

  return true;
}

module.exports.normalizeReplyOptions = (opts) => {
  if (!opts) opts = { delay: 0 };
  if (!opts.delay) opts.delay = 0;
  return opts;
}

/**
 * Replies to a NATS message
 * 
 * @param {Object} message Original message from NATS
 * @param {Object} body 
 * @param {Boolean} body.isError Indicates if the response is an error
 * @param {Number} body.code HTTP status code
 * @param {Object} body.data Data to be sent back to the requester
 * @param {Object} opts
 * @param {Number} opts.timeout Timeout in milliseconds
 * @returns {Boolean} true if a reply was sent to a reply subject
 */
module.exports.reply = (m, body, opts) => {
  // Normalize opts
  opts = this.normalizeReplyOptions(opts);

  const originalMessage = JSONCodec().decode(m.data);
  let natsMesssage = {
    uuid: crypto.uuid(),
    timestamp: new Date().toISOString(),
    application: {
      from: package.name,
      to: originalMessage.application.from,
    },
    payload: body,
    original: originalMessage.original,
  };

  if (opts.delay) {
    setTimeout(() => {
      this.replyExec(m, natsMesssage);
    }, opts.delay);
  }
  else {
    this.replyExec(m, natsMesssage);
  }
}

module.exports.replyExec = (m, body) => {
  try {
    const sc = JSONCodec();
    m.respond(sc.encode(body));
  }
  catch (err) {
    console.error(err)
  }
  finally {
    if (m.reply) inflightCount--;
  }
}

/**
 * 
 * @param {*} topic 
 * @param {*} messageCallback 
 */
module.exports.subscribe = async (topic, messageCallback) => {
  if (topic) {
    log.log('nats', 'subscribed', {topic})
    const subscription = nc.subscribe(topic);
    for await (const m of subscription) {
      if (m.reply) inflightCount++;
      const sc = JSONCodec();
      const message = sc.decode(m.data);
      messageCallback(m, message);
    }
  }
}

module.exports.connected = (cb) => {
  if (nc) cb();
  else {
    this.connect()
      .then(() => {
        cb();
      })
  }
}

module.exports.receive = messageCallback => {
  return new Promise(async (resolve, reject) => {
    try {
      await this.connect();

      const topics = env.get('NATS_TOPICS_SUBSCRIBE', package.name);
      const topicsArray = topics.split(',');

      for (let i = 0; i < topicsArray.length; i++) {
        const topic = topicsArray[i];
        await this.subscribe(topic, messageCallback);
      }
    }
    catch (err) {
      reject(err);
    }
  })
};

module.exports.request = async (topic, message, opts) => {
  if (!nc) {
    throw new Error('NATS connection not initialized');
  };

  if (!opts) opts = { timeout: 5000 };
  const sc = JSONCodec();

  message.uuid = crypto.uuid();
  message.timestamp = new Date().toISOString();
  message.application.from = package.name;

  return nc.request(topic, sc.encode(message), { timeout: opts.timeout })
    .then((response) => {
      return sc.decode(response.data)
    })
    .catch((err) => {
      message.application.to = package.name;
      message.error = {
        code: err.code === 'TIMEOUT' ? 408 : 505,
        data: {
          error: err.code === 'TIMEOUT' ? 'Request timed out' : 'Server error',
        }
      };
      throw message;
    });
}

module.exports.publish = async (topic, message) => {
  if (!nc) {
    throw new Error('NATS connection not initialized');
  };
  log.log('nats', 'publish', {topic,message})
  const sc = JSONCodec();
  const payload = sc.encode(message);
  nc.publish(topic, payload);
}
module.exports.send = this.publish

module.exports.close = async () => {
  log.log('nats', 'close-requested', {inflightCount})

  this.autoDiscover(false)

  if (nc) {
    try {
      const doNotWaitForInflight = env.get('INFLIGHT_DO_NOT_WAIT_ON_EXIT')

      console.log({doNotWaitForInflight})

      if (!doNotWaitForInflight && inflightCount) {
        // Check every 500ms if there are inflight messages
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            log.log('nats', 'close-request-inflightCount-wait', {inflightCount})
            if (!inflightCount) {
              clearInterval(interval)
              resolve()
            }
          }, 500)
        })
      }

      log.log('nats', 'close-draining')
      await nc.drain();

      log.log('nats', 'close-closing')
      await nc.close();

      log.log('nats', 'close-closed')
    } catch (ex) {
      console.error(ex)
    }
  }
};

module.exports.got = () => {
  this.connect()
}