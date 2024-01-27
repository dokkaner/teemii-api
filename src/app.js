const fastify = require('fastify')({ logger: true })
const path = require('path')
const Redis = require('ioredis')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
// spec
const memoryCache = require('./utils/limitedCache')
const mongoDBClient = require('./database/MongoDBClient')
const redisClient = require('./database/RedisClient')
const PgClient = require('./database/PGClient')
const apiUsageTracker = require('./middlewares/APIUsageTracker')


// Content
const compress = require('@fastify/compress')
// Security-related plugins
const helmet = require('@fastify/helmet') // for setting HTTP headers appropriately
const rateLimit = require('@fastify/rate-limit') // for rate limiting to prevent abuse
// Import routes
const mangaRoutes = require('./routes/mangas')


// Start the server
const start = async () => {
  try {
    await fastify.register(helmet)

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      redis: new Redis({
          port: process.env.REDIS_PORT,
          host: process.env.REDIS_HOST,
          username: "default",
          password: process.env.REDIS_PASSWORD,
          db: 1, // Defaults to 0
        }),
    })

    await fastify.register(compress, {
      global: true,
      threshold: 1024,
    })

    await fastify.register(mangaRoutes)

    await fastify.addHook('preHandler', async (request, reply) =>  {
      const apiKey = request.headers['x-api-key']
      if (apiKey) {
        const endpoint = request.routeOptions.url
        const ratePlan = await apiUsageTracker.logUsage(apiKey, endpoint)
        if (!ratePlan) {
          reply.code(429).send({ error: 'Rate limit exceeded or invalid apikey' })
        } else if (ratePlan.status !== 'active') {
            reply.code(401).send({ error: 'API key is disabled' })
        }
      } else {
        reply.code(401).send({ error: 'No API key provided' })
      }
    })

    // In-memory cache configuration
    memoryCache.setup(1000, 60 * 1000)

    // Redis configuration
    await redisClient.connect({
      legacyMode: false,
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
    })

    // MongoDB configuration
    await mongoDBClient.connect(process.env.MONGO_URL, 'teemii')

    // PostgreSQL configuration
    const pgConnectionConfig = {
      host: process.env.PG_HOST,
      port: process.env.PG_PORT,
      database: process.env.PG_DATABASE,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
    }
    const pgClient = PgClient.getInstance()
    await pgClient.connect(pgConnectionConfig)

    await fastify.listen( process.env.PORT || 3000, process.env.ADDRESS || '127.0.0.1')
    fastify.log.info(`Server listening on ${fastify?.server?.address()?.port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

function gracefulShutdown () {
  apiUsageTracker.flushData().then(() => {
    console.log('Shutting down...')
    process.exit(0)
  })
}

// Graceful shutdown
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
start()

module.exports = fastify // Export for unit testing
