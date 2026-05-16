const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');

const execAsync = (command, options) =>
  new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }

      resolve({ stdout, stderr });
    });
  });

const projectRoot = path.resolve(__dirname, '..', '..');
const engineRoot = path.join(projectRoot, 'cpp-engine');
const inputFilePath = path.join(engineRoot, 'input', 'input.json');
const buildDirectory = path.join(engineRoot, 'build');
const resultFilePath = path.join(buildDirectory, 'result.json');
const binaryPath = path.join(buildDirectory, process.platform === 'win32' ? 'route_planner.exe' : 'route_planner');
const supportedAlgorithms = new Set(['dijkstra', 'astar']);

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeEdges(edges, vertices) {
  return edges.map((edge, index) => {
    if (!Array.isArray(edge) || edge.length !== 3) {
      throw createValidationError('edges must be [[u,v,w]] format');
    }

    const [from, to, weight] = edge;

    if (!Number.isInteger(from) || !Number.isInteger(to) || !Number.isInteger(weight)) {
      throw createValidationError('edges must be [[u,v,w]] format');
    }

    if (from < 0 || from >= vertices || to < 0 || to >= vertices) {
      throw createValidationError(`edges[${index}] contains a node outside the vertices range`);
    }

    return [from, to, weight];
  });
}

async function runRoutePlanner({
  vertices,
  edges,
  source,
  destination,
  algorithm,
  undirected = true
}) {
  if (!Number.isInteger(vertices) || vertices <= 0) {
    throw createValidationError('vertices must be a positive integer');
  }

  if (!Array.isArray(edges)) {
    throw createValidationError('edges must be an array');
  }

  if (!Number.isInteger(source) || !Number.isInteger(destination)) {
    throw createValidationError('source and destination must be integers');
  }

  if (source < 0 || source >= vertices || destination < 0 || destination >= vertices) {
    throw createValidationError('source and destination must be within the vertices range');
  }

  if (!supportedAlgorithms.has(algorithm)) {
    throw createValidationError(`algorithm must be one of: ${Array.from(supportedAlgorithms).join(', ')}`);
  }

  if (typeof undirected !== 'boolean') {
    throw createValidationError('undirected must be a boolean');
  }

  const nextInput = {
    vertices,
    edges: normalizeEdges(edges, vertices),
    source,
    destination,
    algorithm,
    undirected
  };

  try {
    await fs.access(binaryPath);
  } catch (error) {
    const binaryError = new Error(`Route planner binary not found at ${binaryPath}`);
    binaryError.statusCode = 500;
    throw binaryError;
  }

  try {
    await fs.writeFile(inputFilePath, JSON.stringify(nextInput, null, 2));
  } catch (error) {
    error.message = `Failed to write ${inputFilePath}: ${error.message}`;
    error.statusCode = 500;
    throw error;
  }

  try {
    await execAsync(`"${binaryPath}"`, { cwd: buildDirectory });
  } catch (error) {
    const execError = new Error(error.stderr || error.message || 'Failed to execute route planner');
    execError.statusCode = 500;
    throw execError;
  }

  try {
    const resultContent = await fs.readFile(resultFilePath, 'utf8');
    return JSON.parse(resultContent);
  } catch (error) {
    error.message = `Failed to read ${resultFilePath}: ${error.message}`;
    error.statusCode = 500;
    throw error;
  }
}

module.exports = { runRoutePlanner };
