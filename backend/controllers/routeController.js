const { runRoutePlanner } = require('../services/routeService');

async function createRoute(req, res, next) {
  try {
    const { vertices, edges, source, destination, algorithm } = req.body;

    if (!Number.isInteger(vertices) || vertices <= 0) {
      const error = new Error('vertices must be a positive integer');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(edges)) {
      const error = new Error('edges must be an array');
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isInteger(source) || !Number.isInteger(destination)) {
      const error = new Error('source and destination must be integers');
      error.statusCode = 400;
      throw error;
    }

    if (!['dijkstra', 'astar'].includes(algorithm)) {
      const error = new Error('algorithm must be either "dijkstra" or "astar"');
      error.statusCode = 400;
      throw error;
    }

    const result = await runRoutePlanner(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { createRoute };
