const { getFromCache, setInCache } = require('./cacheManager')
const customAxiosInstance = require('./customAxiosInstance')

async function getMangaChapters (id) {
  const cacheKey = `manga:${id}:chapters`

  // Try fetching from cache first
  const cachedResult = await getFromCache(cacheKey)
  if (cachedResult) {
    return JSON.parse(cachedResult)
  }

  // Perform the search  in ES when cache miss occurs
  const payload = {
    from: 0,
    size: 10000,
    query: {
      simple_query_string: {
        query: id,
        fields: ['mangaId'],
      }
    },
    sort: [{ 'chapterNum.keyword': { order: 'asc' } }]
  }
  const results = await customAxiosInstance.post(`teemii.chapters/_search`, payload)
  const rows = await results.data.hits.hits.map((hit) => hit._source)
  const total = results.data.hits.total.value

  // Cache the results
  setInCache(cacheKey, rows)
  return { count: total, rows }
}

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

  // Cache the results
  setInCache(cacheKey, result)
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

  // compute start performance
  // const start = process.hrtime.bigint()

  // Perform the search in ES when cache miss occurs
  const payload = {
    query: { query_string: { query } },
    sort: [{ '_score': 'desc' }, { [sortBy]: order.toLowerCase() === 'asc' ? 'asc' : 'desc' }],
    from: offset,
    size: limit,
  };

  const { data } = await customAxiosInstance.post('teemii.mangas/_search', payload);
  const total = data.hits.total.value;

  const rows = data.hits.hits.map(hit => ({ id: hit._id, ...hit._source }));

  // compute end performance (in milliseconds)
  // const end = process.hrtime.bigint()
  // const time = Number(end - start) / 1000000
  // console.log(`ES search took ${time} ms`)

  setInCache(cacheKey, JSON.stringify(rows)).catch(console.error);

  return { count: total, rows };
}

module.exports = { searchManga, getManga, getMangaChapters }
