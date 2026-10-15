// Simple in-memory cache using a Map.
// Each entry holds the value and an expiry timestamp.
// Not suitable for multi-process deployments (use Redis there).

const store = new Map();

function set(key, value, ttlSeconds) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  store.set(key, { value, expiresAt });
}

function get(key) {
  const item = store.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    store.delete(key);
    return null;
  }
  return item.value;
}

function del(key) {
  store.delete(key);
}

// Delete all keys that start with a given prefix (e.g. all cache for one user)
function delByPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

function size() {
  return store.size;
}

module.exports = { set, get, del, delByPrefix, size };
