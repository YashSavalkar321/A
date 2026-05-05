const { MongoClient } = require('mongodb');
const cassandra = require('cassandra-driver');

const prn = process.env.PRN || '23510027';
const mongoDbName = `prn_${prn}`;
const cassandraKeyspace = `prn_${prn}`;

/* ─── MongoDB ─── */
let mongoClient;
let mongoDb;

async function initMongo() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  mongoDb = mongoClient.db(mongoDbName);
  await mongoDb.collection('students').createIndex({ email: 1 }, { unique: true });
  console.log(`  ✔ MongoDB connected  → db: ${mongoDbName}`);
}

function getMongoCollection() {
  return mongoDb.collection('students');
}

/* ─── CassandraDB ─── */
let cassandraClient;

async function initCassandra() {
  const contactPoints = (process.env.CASSANDRA_CONTACT_POINTS || '127.0.0.1').split(',');
  const port = Number(process.env.CASSANDRA_PORT || 9042);
  const localDataCenter = process.env.CASSANDRA_DATACENTER || 'datacenter1';

  // Connect without keyspace first to create it if needed
  const tempClient = new cassandra.Client({
    contactPoints,
    localDataCenter,
    protocolOptions: { port }
  });
  await tempClient.connect();

  await tempClient.execute(`
    CREATE KEYSPACE IF NOT EXISTS ${cassandraKeyspace}
    WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': 1 }
  `);
  await tempClient.shutdown();

  // Reconnect with the keyspace
  cassandraClient = new cassandra.Client({
    contactPoints,
    localDataCenter,
    keyspace: cassandraKeyspace,
    protocolOptions: { port }
  });
  await cassandraClient.connect();

  await cassandraClient.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY,
      name TEXT,
      email TEXT,
      course TEXT,
      created_at TIMESTAMP
    )
  `);

  // Index on email for lookup (not unique in Cassandra by default)
  await cassandraClient.execute(`
    CREATE INDEX IF NOT EXISTS ON students (email)
  `);

  console.log(`  ✔ Cassandra connected → keyspace: ${cassandraKeyspace}`);
}

function getCassandraClient() {
  return cassandraClient;
}

/* ─── Init Both ─── */
async function initDatabases() {
  console.log('Connecting to databases …');
  await initMongo();
  await initCassandra();
  console.log('All databases ready.\n');
}

module.exports = {
  initDatabases,
  getMongoCollection,
  getCassandraClient,
  mongoDbName,
  cassandraKeyspace
};
