// Exercise 5: What order do these print?

console.log('1. start');   // sync, runs immediately

setTimeout(() => {
  console.log('5. setTimeout');   // macrotask
}, 0);

setImmediate(() => {
  console.log('6. setImmediate');  // macrotask
});

Promise.resolve().then(() => {
  console.log('3. Promise.then');  // microtask
});

process.nextTick(() => {
  console.log('2. nextTick');      // microtask, highest priority
});

console.log('4. end');    // sync, will be still in the same stack

// Expected output:
//   1. start
//   4. end
//   2. nextTick
//   3. Promise.then
//   5/6. setTimeout and setImmediate — order is NOT guaranteed here

// setTimeout(0) or setImmediate order depends on how fast the timer is ready.
// Outside of an I/O callback, any one of them can run first.
// The only prediction is inside an I/O callback, setImmediate always runs before setTimeout.
