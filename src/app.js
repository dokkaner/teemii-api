const fastify = require('fastify')({ logger: {level: 'warn'}})
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
// spec
const memoryCache = require('./utils/limitedCache')
const redisClient = require('./database/RedisClient')

// Import routes
const mangaRoutes = require('./routes/mangas')

// Start the server
const start = async () => {
  try {
    await fastify.register(mangaRoutes)

    // In-memory cache configuration
    memoryCache.setup(1000, 60 * 1000)

    // Redis configuration
    const redisUrl = `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}`
    console.warn('Connecting to Redis at ', process.env.REDIS_HOST)
    await redisClient.connect({
      legacyMode: false,
      url: redisUrl,
    })


    await fastify.listen( process.env.PORT || 3000, process.env.ADDRESS || '127.0.0.1')
    fastify.log.info(`Server listening on ${fastify?.server?.address()?.port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

function gracefulShutdown () {
  console.log('Shutting down...')
  process.exit(0)
}

// Graceful shutdown
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
start()

module.exports = fastify // Export for unit testing