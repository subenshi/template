const mongodb = require('mongodb');

const env = require('./env');
const log = require('./log');

let db;
let client;

const mongodbConnectionString = env.get('MONGODB_CONNECTION_STRING');
const mongodbDatabase = env.get('MONGODB_DATABASE');

module.exports.connect = async () => {
  if (!mongodbConnectionString) {
    log.log('mongodb-connection-string', 'not set');
    return;
  }
  if (!mongodbDatabase) throw new Error('MONGODB_DATABASE is not set');

  // Mask connection string
  const maskedConnectionString = mongodbConnectionString.replace(/\/\/.*@/, '//***:***@');
  log.log('mongodb-connecting', maskedConnectionString)

  const { MongoClient } = require('mongodb');
  client = new MongoClient(mongodbConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    heartbeatFrequencyMS: 1000
  });

  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    log.log('mongodb-connected')
    db = client.db(mongodbDatabase);
  }

  return main()
}

module.exports.db = (collection) => {
  if (!db) throw new Error('MongoDB is not connected');
  if (!collection) collection = env.get('MONGODB_COLLECTION');
  if (!collection) throw new Error('MONGODB_COLLECTION is not set');
  return db.collection(collection);
}

module.exports.close = async () => {
  if (client) {
    log.log('mongodb-closing')
    await client.close();
    log.log('mongodb-closed')
  }
}
