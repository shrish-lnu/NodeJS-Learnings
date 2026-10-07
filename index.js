require('dotenv').config();
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const folder = process.argv[2];

if (!folder) {
  logger.error('Please give a folder. Example: node index.js test-folder');
  process.exit(1);
}

if (!fs.existsSync(folder)) {
  logger.error('Folder not found: ' + folder);
  process.exit(1);
}

const files = fs.readdirSync(folder);

for (const file of files) {
  const filePath = path.join(folder, file);

  if (fs.statSync(filePath).isDirectory()) continue;

  const ext = path.extname(file).slice(1) || 'other';
  const newFolder = path.join(folder, ext);
  const newPath = path.join(newFolder, file);

  if (!fs.existsSync(newFolder)) fs.mkdirSync(newFolder);

  if (fs.existsSync(newPath)) {
    logger.warn('Skipped (already exists): ' + file);
    continue;
  }

  fs.renameSync(filePath, newPath);
  logger.info('Moved ' + file + ' -> ' + ext + '/');
}
