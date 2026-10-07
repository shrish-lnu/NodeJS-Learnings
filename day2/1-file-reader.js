// Exercise 1: Three ways to read a file
// callback -> Promise -> async/await

const fs = require('fs');

// --- 1. Callback (old way) ---
// Works, but gets messy when you nest more operations inside

function readWithCallback() {
  fs.readFile('day2/sample.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Callback error:', err.message);
      return;
    }
    console.log('Callback result:', data);
  });
}

// --- 2. Promise (wrapping callback ourselves) ---

function readWithPromise() {
  const readFile = (filePath) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };

  readFile('day2/sample.txt')
    .then((data) => console.log('Promise result:', data))
    .catch((err) => console.error('Promise error:', err.message));
}

// --- 3. Async/Await (cleanest way) ---

async function readWithAsyncAwait() {
  try {
    const data = await fs.promises.readFile('day2/sample.txt', 'utf8');
    console.log('Async/Await result:', data);
  } catch (err) {
    console.error('Async/Await error:', err.message);
  }
}

async function main() {
  try {
    await fs.promises.writeFile('day2/sample.txt', 'Hello from Day 2!\n');
  } catch (err) {
    console.error('Could not create sample.txt:', err.message);
    return;
  }

  readWithCallback();
  readWithPromise();
  await readWithAsyncAwait();
}

main();
