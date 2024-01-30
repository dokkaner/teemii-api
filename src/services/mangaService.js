const { getFromCache, setInCache } = require('./cacheManager')
const customAxiosInstance = require('./customAxiosInstance')



async function getManga (id) {
  const cacheKey = `manga:${id}`

  // Try fetching from cache first
  const cachedResult = await getFromCache(cacheKey)
  if (cachedResult) {
    return JSON.parse(cachedResult)
  }

  // Perform the search  in ES when cache miss occurs
  const results = await customAxiosInstance.get(`teemii.mangas/_doc/${id}`)
  const result = results.data._source
  result.id = results.data._id

  // Cache the results
  setInCache(cacheKey, result).catch(console.error);
  return result
}

async function searchManga (query, limit = 25, offset = 0, sortBy = 'popularityRank', order = 'ASC') {
  const cacheKey = `search:${query}:${limit}:${offset}:${sortBy}:${order}`;

  // Try fetching from cache first
  const cachedResult = await getFromCache(cacheKey);
  if (cachedResult) {
    const rows = JSON.parse(cachedResult);
    return { count: rows.length, rows };
  }

  const payload = {
    query: { query_string: { query } },
    sort: [{ '_score': 'desc' }, { [sortBy]: order.toLowerCase() === 'asc' ? 'asc' : 'desc' }],
    from: offset,
    size: limit,
  };

  const { data } = await customAxiosInstance.post('teemii.mangas/_search', payload);
  const total = data.hits.total.value;
  const hits = data.hits.hits;
  const rows = new Array(hits.length);
  for (let i = 0; i < hits.length; i++) {
    rows[i] = { id: hits[i]._id, ...hits[i]._source };
  }

  setInCache(cacheKey, rows).catch(console.error);

  return { count: total, rows };
}

async function getMangaChapters (id, limit, offset) {
  const cacheKey = `manga:${id}:chapters`

  // Try fetching from cache first
  const cachedResult = await getFromCache(cacheKey)
  if (cachedResult) {
    const rows = JSON.parse(cachedResult);
    return { count: rows.length, rows };
  }

  // Perform the search  in ES when cache miss occurs
  const payload = {
    query: {
      simple_query_string: {
        query: id,
        fields: ['mangaId'],
      }
    },
    sort: [{ 'chapterNum.keyword': { order: 'asc' } }],
    from: offset,
    size: limit
  }
  const results = await customAxiosInstance.post(`teemii.chapters/_search`, payload)
  const hits = results.data.hits.hits;
  const rows = new Array(hits.length);
  for (let i = 0; i < hits.length; i++) {
    rows[i] = { id: hits[i]._id, ...hits[i]._source };
  }
  const total = results.data.hits.total.value

  // Cache the results
  setInCache(cacheKey, rows).catch(console.error);
  return { count: total, rows }
}

module.exports = { searchManga, getManga, getMangaChapters }
