const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

async function connectDB() {
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGODB_URI);
  logger.info('MongoDB connected');
}

async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

module.exports = { connectDB, disconnectDB };
