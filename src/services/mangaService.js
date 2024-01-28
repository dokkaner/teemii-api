const { getFromCache, setInCache } = require('./cacheManager')
const customAxiosInstance= require('./customAxiosInstance')


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
      simple_query_string : {
        query: id,
        fields: ["mangaId"],
      }
    },
    sort: [{ "chapterNum.keyword": {order:'asc'}}]
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
  const cacheKey = `search:${query}:${limit}:${offset}:${sortBy}:${order}`

  // Try fetching from cache first
  const cachedResult = await getFromCache(cacheKey)
  if (cachedResult) {
    const rows = JSON.parse(cachedResult)
    return { count: rows.length, rows }
  }

  // compute start performance
  const start = process.hrtime.bigint();

  // Perform the search in ES when cache miss occurs

  //{"query":{"query_string":{"query":"one"}},"size":10,"from":0,"sort":[]}
  const payload = {
    query: {
      query_string: {
        query:  query
      },
    },
    "sort": [
      { "_score": "desc"},
      { [sortBy]: order === 'ASC' ? "asc" : "desc" }
    ],
    from: offset,
    size: limit,
  }
  //const results = await axios.post('https://api.pencilectric.org/plume/teemii.mangas/_search', payload)
  const results = await customAxiosInstance.post('teemii.mangas/_search', payload)
  const total = results.data.hits.total.value
  // compute end performance (in milliseconds)
  // 150 ms for mongoDB (query: one) 120 ms for mongoDB (query: girl)
  // 281 ms for ES (query: one)  281 ms query girl
  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1000000;
  console.log(`MongoDB search took ${time} ms`);

  // Cache the results
  const rows = await results.data.hits.hits.map((hit) => { return { id: hit._id, ...hit._source  }})
  setInCache(cacheKey, rows)
  return { count: total, rows }
}

module.exports = { searchManga, getManga, getMangaChapters }
