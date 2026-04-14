const { runRoutePlanner } = require('../services/routeService');

async function createRoute(req, res, next) {
  try {
    const { source, destination, algorithm } = req.body;

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

    const result = await runRoutePlanner({ source, destination, algorithm });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { createRoute };
