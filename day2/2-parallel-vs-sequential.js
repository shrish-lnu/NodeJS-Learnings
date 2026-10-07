// Exercise 2: Fetch 10 URLs — parallel vs sequential, compare timing

const URLS = [
  'https://jsonplaceholder.typicode.com/posts/1',
  'https://jsonplaceholder.typicode.com/posts/2',
  'https://jsonplaceholder.typicode.com/posts/3',
  'https://jsonplaceholder.typicode.com/posts/4',
  'https://jsonplaceholder.typicode.com/posts/5',
  'https://jsonplaceholder.typicode.com/todos/1',
  'https://jsonplaceholder.typicode.com/todos/2',
  'https://jsonplaceholder.typicode.com/users/1',
  'https://jsonplaceholder.typicode.com/users/2',
  'https://jsonplaceholder.typicode.com/albums/1',
];

// Fetch one URL and return its title
async function fetchOne(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.title || data.name || 'no title';
  } catch (err) {
    return 'failed: ' + err.message;
  }
}

// Sequential: wait for each one before starting the next
async function fetchSequentially() {
  console.log('\n-- Sequential --');
  const start = Date.now();

  for (const url of URLS) {
    const title = await fetchOne(url);
    console.log(' >', title);
  }

  console.log('Time taken:', Date.now() - start, 'ms');
}

// Parallel: fire all at once, wait for all to finish
async function fetchInParallel() {
  console.log('\n-- Parallel (Promise.all) --');
  const start = Date.now();

  try {
    const results = await Promise.all(URLS.map(fetchOne));
    results.forEach((title) => console.log(' >', title));
    console.log('Time taken:', Date.now() - start, 'ms');
  } catch (err) {
    console.error('One failed, Promise.all stopped:', err.message);
  }
}

// allSettled: parallel but keeps going even if one fails (adding it as it was mentioned it in the concepts to cover section for Day 2)
async function fetchWithAllSettled() {
  console.log('\n-- Parallel (Promise.allSettled) --');
  const start = Date.now();

  const results = await Promise.allSettled(URLS.map(fetchOne));

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      console.log(' >', result.value);
    } else {
      console.log(' x failed:', result.reason);
    }
  });

  console.log('Time taken:', Date.now() - start, 'ms');
}

async function main() {
  await fetchSequentially();
  await fetchInParallel();
  await fetchWithAllSettled();
}

main();
