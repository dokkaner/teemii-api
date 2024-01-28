const mangaService = require("../services/mangaService");
const { getPagination, getPagingData } = require('../services/common')

function handleError(err, reply) {
  switch (err.response.status) {
    case 401:
      return reply.status(401).send({ message: "Unauthorized" });
    case 400:
      return reply.status(400).send({ message: "Bad request" });
    case 404:
      return reply.status(404).send({ message: "Manga not found" });
    case 500:
      return reply.status(500).send({ message: "Error in fetching data" });
  }
  reply.status(500).send({ message: "Error in fetching data" });
}
async function getMangaChapters(fastify, request, reply) {
  try {
    const id = request.params.id;
    const result = await mangaService.getMangaChapters(id);
    if (!result) {
      return reply.status(404).send({ message: "Manga not found" });
    }
    reply.send(result);
  } catch (err) {
    request.log.error(err);
    handleError(err, reply);
  }
}

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
    handleError(err, reply);
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
    handleError(err, reply);
  }
}

module.exports = { searchManga, getManga, getMangaChapters };
