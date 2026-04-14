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
const inputFilePath = path.join(projectRoot, 'input', 'input.json');
const resultFilePath = path.join(projectRoot, 'output', 'result.json');
const buildDirectory = path.join(projectRoot, 'build');
const binaryPath = path.join(buildDirectory, process.platform === 'win32' ? 'route_planner.exe' : 'route_planner');

async function runRoutePlanner({ source, destination, algorithm }) {
  let inputConfig;

  try {
    const inputContent = await fs.readFile(inputFilePath, 'utf8');
    inputConfig = JSON.parse(inputContent);
  } catch (error) {
    error.message = `Failed to read ${inputFilePath}: ${error.message}`;
    error.statusCode = 500;
    throw error;
  }

  const nextInput = {
    ...inputConfig,
    source,
    destination,
    algorithm
  };

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
