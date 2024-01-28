const redisClient  = require("../database/RedisClient");
const memoryCache = require("../utils/limitedCache");

function getFromMemoryCache(cacheKey) {
  if (process.env.ENABLE_MEMCACHED === "1" && memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }
  return null;
}

async function getFromRedis(cacheKey) {
  if (process.env.ENABLE_REDIS === "1" && redisClient.client.exists(cacheKey)) {
    try {
      const cachedResults = await redisClient.client.get(cacheKey);
      setInMemoryCache(cacheKey, cachedResults);
      return cachedResults;
    } catch (error) {
      console.error("Redis cache fetch error:", error);
    }
  }
  return null;
}

async function setInRedis(cacheKey, data) {
  if (process.env.ENABLE_REDIS === "1") {
    try {
      await redisClient.client.set(cacheKey, data, "NX", "EX", 3600);
    } catch (error) {
      console.error("Redis cache set error:", error);
    }
  }
}

function setInMemoryCache(cacheKey, data) {
  if (process.env.ENABLE_MEMCACHED === "1") {
    try {
      memoryCache.set(cacheKey, data);
    } catch (error) {
      console.error("In-memory cache set error:", error);
    }
  }
}
async function getFromCache(cacheKey) {
  let cachedResult = getFromMemoryCache(cacheKey);
  if (!cachedResult) {
    cachedResult = await getFromRedis(cacheKey);
  }

  if (cachedResult) {
    return cachedResult;
  }

  return null;
}

async function setInCache(cacheKey, data) {
  const dataset =  JSON.stringify(data);
  setInMemoryCache(cacheKey, dataset);
  await setInRedis(cacheKey, dataset);
}

module.exports = { getFromCache, setInCache };
