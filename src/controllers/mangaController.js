const mangaService = require("../services/mangaService");
const { getPagination, getPagingData } = require('../services/common')

async function getManga(fastify, request, reply) {
  try {
    const id = request.params.id;
    const result = await mangaService.getManga(id);
    if (!result) {
      return reply.status(404).send({ message: "Manga not found" });
    }
    reply.send(result);
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ message: "Error in fetching data" });
  }
}

async function searchManga(fastify, request, reply) {
  try {
    const query = request.query.q;

    if (!query || query.trim().length === 0) {
      return reply.status(400).send({ message: "Query is required" });
    }

    // set default values
    const page = request.query.page || 0;
    const size = request.query.size || 25;
    const sortBy = request.query.sortBy || 'popularityRank';
    const order = request.query.order || 'ASC';

    const { limit, offset } = getPagination(page, size)
    const results = await mangaService.searchManga(query, limit, offset, sortBy, order);
    const response = getPagingData(results, page, limit)
    reply.send(response);
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ message: "Error in fetching data" });
  }
}

module.exports = { searchManga, getManga };
