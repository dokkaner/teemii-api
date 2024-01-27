class LimitedCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
    this.ttl = 60 * 1000;
  }

  setup(maxSize, ttl) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    const expireAt = Date.now() + this.ttl;

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this._getOldestKey();
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, expireAt });
  }

  get(key) {
    const item = this.cache.get(key);

    if (item) {
      if (Date.now() < item.expireAt) {
        return item.value;
      }

      this.cache.delete(key);
    }

    return null;
  }

  has(key) {
    return this.cache.has(key);
  }

  _getOldestKey() {
    return this.cache.keys().next().value;
  }
}


const memoryCache = new LimitedCache();
module.exports = memoryCache;
