// Exercise 3: Copy a file using streams, then uppercase it with a Transform stream

const fs = require('fs');
const { pipeline, Transform } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

async function createSampleFile() {
  try {
    const lines = Array.from({ length: 10000 }, (_, i) => `Line ${i + 1}: hello world\n`);
    await fs.promises.writeFile('day2/bigfile.txt', lines.join(''));
    console.log('Sample file created: day2/bigfile.txt');
  } catch (err) {
    console.error('Could not create file:', err.message);
    process.exit(1);
  }
}

// Simple stream copy
async function copyFile() {
  console.log('\n-- Copying file with streams --');

  try {
    await pipelineAsync(
      fs.createReadStream('day2/bigfile.txt'),
      fs.createWriteStream('day2/bigfile-copy.txt')
    );
    console.log('Done. Check day2/bigfile-copy.txt');
  } catch (err) {
    console.error('Copy failed:', err.message);
  }
}

// Copy + uppercase using a Transform stream
async function copyWithUppercase() {
  console.log('\n-- Copying + uppercasing --');

  const uppercase = new Transform({
    transform(chunk, encoding, done) {
      try {
        this.push(chunk.toString().toUpperCase());
        done();
      } catch (err) {
        done(err);
      }
    },
  });

  try {
    await pipelineAsync(
      fs.createReadStream('day2/bigfile.txt'),
      uppercase,
      fs.createWriteStream('day2/bigfile-upper.txt')
    );
    console.log('Done. Check day2/bigfile-upper.txt');
  } catch (err) {
    console.error('Uppercase copy failed:', err.message);
  }
}

async function main() {
  await createSampleFile();
  await copyFile();
  await copyWithUppercase();
}

main();
