/**
 * MemClaw 性能优化
 * API 响应 < 50ms，搜索 < 200ms
 */

// 缓存层
class Cache {
  constructor() {
    this.cache = new Map();
    this.stats = new Map();
    this.defaultTTL = 300000; // 5分钟
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
    this.stats.set(key, { hits: 0, misses: 0 });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      const stats = this.stats.get(key) || { hits: 0, misses: 0 };
      stats.misses++;
      this.stats.set(key, stats);
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      const stats = this.stats.get(key) || { hits: 0, misses: 0 };
      stats.misses++;
      this.stats.set(key, stats);
      return null;
    }

    const stats = this.stats.get(key) || { hits: 0, misses: 0 };
    stats.hits++;
    this.stats.set(key, stats);
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.stats.clear();
  }

  getStats() {
    return Object.fromEntries(this.stats.entries());
  }

  getCacheHitRate() {
    let totalHits = 0;
    let totalMisses = 0;
    for (const stats of this.stats.values()) {
      totalHits += stats.hits;
      totalMisses += stats.misses;
    }
    const total = totalHits + totalMisses;
    return total > 0 ? (totalHits / total * 100).toFixed(2) + '%' : '0%';
  }
}

module.exports = Cache;
