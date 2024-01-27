const { getFromCache, setInCache } = require('./cacheManager')
const mongoDBClient = require('../database/MongoDBClient')

async function getManga (id) {
  const cacheKey = `manga:${id}`

  // Try fetching from cache first
  const cachedResult = await getFromCache(cacheKey)
  if (cachedResult) {
    return JSON.parse(cachedResult)
  }

  // Perform the search in MongoDB when cache miss occurs
  const result = await mongoDBClient.db.collection('mangas').findOne({ _id: mongoDBClient.toObjectId(id) })
  if (!result) {
    return null
  }

  // Cache the results
  await setInCache(cacheKey, result)
  return result
}

async function searchManga (query, limit = 25, offset = 0, sortBy = 'popularityRank', order = 'ASC') {
  const cacheKey = `search:${query}:${limit}:${offset}:${sortBy}:${order}`

  // Try fetching from cache first
  const cachedResult = await getFromCache(cacheKey)
  if (cachedResult) {
    const rows = JSON.parse(cachedResult)
    return { count: rows.length, rows }
  }

  // compute start performance
  //const start = process.hrtime.bigint();

  // Perform the search in MongoDB when cache miss occurs
  const mongoQuery = {
    $or: [
      { canonicalTitle: { $regex: query, $options: 'i' } },
      { altTitles: { $regex: query, $options: 'i' } },
    ],
  }
  const results = mongoDBClient.db.collection('mangas').find(mongoQuery).sort({ [sortBy]: order === 'ASC' ? 1 : -1 }).skip(offset).limit(limit)

  const total = await mongoDBClient.db.collection('mangas').countDocuments(mongoQuery)

  // compute end performance
  //const end = process.hrtime.bigint();
  //const time = Number(end - start) / 1000000;
  //console.log(`MongoDB search took ${time} ms`);

  // Cache the results
  const rows = await results.toArray()
  await setInCache(cacheKey, rows)
  return { count: total, rows }
}

module.exports = { searchManga, getManga }
