const mangaController = require('../controllers/mangaController');

async function mangaRoutes(fastify) {
  fastify.get('/mangas/search', async (request, reply) => {
    return mangaController.searchManga(fastify, request, reply);
  });
  fastify.get('/mangas/:id', async (request, reply) => {
    return mangaController.getManga(fastify, request, reply);
  });
  fastify.get('/mangas/:id/chapters', async (request, reply) => {
    return mangaController.getMangaChapters(fastify, request, reply);
  });
}

module.exports = mangaRoutes;
