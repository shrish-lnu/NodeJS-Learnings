const EventEmitter = require('events');
const fs = require('fs');

class Logger extends EventEmitter {}

const logger = new Logger();

function write(level, message) {
  const line = new Date().toISOString() + ' [' + level + '] ' + message + '\n';
  fs.appendFileSync(process.env.LOG_FILE || 'app.log', line);
  console.log(line.trim());
}

logger.on('info', (msg) => write('INFO', msg));
logger.on('warn', (msg) => write('WARN', msg));
logger.on('error', (msg) => write('ERROR', msg));

logger.info = (msg) => logger.emit('info', msg);
logger.warn = (msg) => logger.emit('warn', msg);
logger.error = (msg) => logger.emit('error', msg);

module.exports = logger;
