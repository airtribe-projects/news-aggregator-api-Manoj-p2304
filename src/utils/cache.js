/**
 * Tiny in-memory cache with a per-entry TTL.
 *
 * The free tiers of most news providers cap you at ~100 requests/day, so we
 * cache responses for a few minutes and serve repeated queries from memory.
 * Expired entries are evicted lazily on the next read.
 */
class TtlCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = TtlCache;
