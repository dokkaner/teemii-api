const { EventEmitter } = require('events');
const PgClient  = require('../database/pgClient')
const memoryCache = require("../utils/LimitedCache");

class APIUsageTracker extends EventEmitter {
  constructor(flushInterval, flushThreshold) {
    super();

    this.usageData = new Map();
    this.flushInterval = flushInterval;
    this.flushThreshold = flushThreshold;
    this.startFlushInterval();
  }

  async getRatePlan(apiKey) {
    const key  = `ratePlan:${apiKey}`;
    const cachedResult = memoryCache.get(key);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    const pgClient = PgClient.getInstance();
    const result = await pgClient.db.oneOrNone(
      'SELECT rp.rate_limit_months, ak.status ' +
      'FROM api_key ak ' +
      'INNER JOIN "user" u ON ak.user_id = u.user_id ' +
      'INNER JOIN rate_plan rp ON u.rate_plan_id = rp.rate_plan_id ' +
      'WHERE ak.key = $1', apiKey
    );

    if (result) {
      this.rateLimit = result.status;
      this.rateLimitMonths = result.rate_limit_months;

      const dataset =  JSON.stringify(result);
      memoryCache.set(key, dataset);
      return result;
    }
  }

  // Log API usage for a given apiKey and endpoint.
  async logUsage(apiKey, endpoint) {
    const timestamp = new Date();
    const keyUsage = this.usageData.get(apiKey) || {};
    const usage = keyUsage[endpoint] || { count: 0, lastAccess: null };
    usage.count += 1;
    usage.lastAccess = timestamp;
    keyUsage[endpoint] = usage;
    this.usageData.set(apiKey, keyUsage);
    // Check if the flushThreshold is reached and trigger flush if necessary.
    if (usage.count >= this.flushThreshold) {
      await this.flushData();
    }

    return await this.getRatePlan(apiKey);
  }

  // Start the flush interval to periodically push data to an external database.
  startFlushInterval() {
    setInterval(() => {
      this.flushData();
    }, this.flushInterval);
  }

  // Flush data to an external database (you need to implement this part).
  async flushData() {
    try {
      // save usage data to database
      for (const [apiKey, keyUsage] of this.usageData.entries()) {
        for (const [endpoint, usage] of Object.entries(keyUsage)) {
          await this.saveUsage(apiKey, endpoint, usage.count);
        }
      }
    } catch (err) {
      console.error('Error saving usage data:', err.message);
    }
    // Clear data after successful push.
    this.usageData.clear();
  }

  async saveUsage(apiKey, endpoint, count) {
    const timestamp = new Date();
    try {
      const pgClient = PgClient.getInstance();
      await pgClient.db.none(
        'INSERT INTO usage (api_key, endpoint, timestamp, count) VALUES ($1, $2, $3, $4)',
        [apiKey, endpoint, timestamp, count]
      );
    } catch (error) {
      console.error('Error saving usage data:', error.message);
    }
  }

}

const apiUsageTracker = new APIUsageTracker(10 * 60 * 1000, 1000);
module.exports = apiUsageTracker;
