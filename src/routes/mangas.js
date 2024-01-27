const mangaController = require('../controllers/mangaController');

async function mangaRoutes(fastify) {
  fastify.get('/mangas/search', async (request, reply) => {
    return mangaController.searchManga(fastify, request, reply);
  });
  fastify.get('/mangas/:id', async (request, reply) => {
    return mangaController.getManga(fastify, request, reply);
  });
}

module.exports = mangaRoutes;
