const SUPPORTED_ALGORITHMS = new Set(['dijkstra', 'astar']);
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

    if (!SUPPORTED_ALGORITHMS.has(algorithm)) {
      const error = new Error(`algorithm must be one of: ${Array.from(SUPPORTED_ALGORITHMS).join(', ')}`);
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
