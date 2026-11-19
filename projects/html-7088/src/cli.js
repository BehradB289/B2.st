#!/usr/bin/env node
/**
 * B2.st Mario HTML5 Game - Management CLI Tool
 * 
 * Command-line interface providing commands to:
 * - Boot local development/production static web server with integrated Health Monitoring
 * - Run real-time health diagnostic checks in console
 * - Validate tilemap level configurations (JSON schemas, spawn points)
 * - Run test suites and assertion pipelines
 * - Expose Prometheus metrics on stdout or HTTP
 * 
 * Usage:
 *   node src/cli.js <command> [options]
 *   mario-cli <command> [options]
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { HealthMonitor, HealthStatus } from './core/health_monitor.js';
import { ServerConfig } from '../config/server.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ASCII Color Constants for terminal output
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const BANNER = `
${Colors.red}${Colors.bright}  ██████╗ ██████╗       ███████╗████████╗
  ██╔══██╗╚════██╗      ██╔════╝╚══██╔══╝
  ██████╦╝ █████╔╝█████╗███████╗   ██║   
  ██╔══██╗ ╚═══██╗╚════╝╚════██║   ██║   
  ██████╦╝██████╔╝      ███████║   ██║   
  ╚═════╝ ╚═════╝       ╚══════╝   ╚═╝   ${Colors.reset}
  ${Colors.yellow}★ B2.st Super Mario HTML5 - Management CLI v1.0.0 ★${Colors.reset}
`;

/**
 * Robust CLI argument parser
 * Supports:
 *   cmd --flag value
 *   cmd --flag=value
 *   cmd -f value
 *   cmd -f
 *   cmd --boolean
 */
export function parseArgs(rawArgs = process.argv.slice(2)) {
  const parsed = {
    command: null,
    flags: {},
    positionals: []
  };

  let i = 0;
  if (rawArgs.length > 0 && !rawArgs[0].startsWith('-')) {
    parsed.command = rawArgs[0];
    i = 1;
  }

  for (; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg.startsWith('--')) {
      const content = arg.slice(2);
      if (content.includes('=')) {
        const [key, val] = content.split('=', 2);
        parsed.flags[key] = val;
      } else if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
        parsed.flags[content] = rawArgs[++i];
      } else {
        parsed.flags[content] = true;
      }
    } else if (arg.startsWith('-')) {
      const char = arg.slice(1);
      if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
        parsed.flags[char] = rawArgs[++i];
      } else {
        parsed.flags[char] = true;
      }
    } else {
      parsed.positionals.push(arg);
    }
  }

  return parsed;
}

/**
 * Validates a level map JSON structure
 * Checks layer arrays, dimension sanity, entity and player spawn points.
 */
export function validateLevelStructure(levelData) {
  const issues = [];

  if (!levelData || typeof levelData !== 'object') {
    return { valid: false, issues: ['Level data is not a valid JSON object'] };
  }

  if (typeof levelData.width !== 'number' || levelData.width <= 0) {
    issues.push('Missing or invalid "width" (must be positive integer)');
  }
  if (typeof levelData.height !== 'number' || levelData.height <= 0) {
    issues.push('Missing or invalid "height" (must be positive integer)');
  }
  if (typeof levelData.tileSize !== 'number' || levelData.tileSize <= 0) {
    issues.push('Missing or invalid "tileSize" (must be positive integer)');
  }

  if (!levelData.layers || typeof levelData.layers !== 'object') {
    issues.push('Missing "layers" object definition');
  } else {
    if (!Array.isArray(levelData.layers.collision)) {
      issues.push('Missing "layers.collision" tile array');
    } else {
      const expectedLength = (levelData.width || 0) * (levelData.height || 0);
      if (expectedLength > 0 && levelData.layers.collision.length !== expectedLength) {
        issues.push(`Collision layer length mismatch: expected ${expectedLength}, got ${levelData.layers.collision.length}`);
      }
    }
  }

  if (!levelData.playerSpawn || typeof levelData.playerSpawn.x !== 'number' || typeof levelData.playerSpawn.y !== 'number') {
    issues.push('Missing or invalid "playerSpawn" coordinates ({x: number, y: number})');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Static file server implementation with security and path normalization
 */
function createStaticFileHandler(publicDir) {
  return (req, res) => {
    let reqPath = (req.url || '/').split('?')[0];
    if (reqPath === '/') {
      reqPath = '/index.html';
    }

    // Prevent directory traversal attacks
    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(publicDir, safePath);

    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden: Directory traversal prohibited');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Not Found: ${reqPath}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = ServerConfig.staticServer.mimeTypes[ext] || 'application/octet-stream';
      const cacheControl = ext === '.html'
        ? ServerConfig.staticServer.cacheControl.dynamic
        : ServerConfig.staticServer.cacheControl.staticAssets;

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff'
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
      readStream.on('error', (streamErr) => {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        res.end('500 Internal Server Error');
      });
    });
  };
}

/**
 * Command: serve
 * Boots the HTTP Server with static asset serving and health check endpoints.
 */
async function handleServeCommand(flags) {
  console.log(BANNER);

  const port = parseInt(flags.port || flags.p || ServerConfig.server.port, 10);
  const host = flags.host || flags.h || ServerConfig.server.host;
  const publicDir = flags.public || flags.dir || ServerConfig.paths.public;

  if (!fs.existsSync(publicDir)) {
    console.warn(`${Colors.yellow}Warning: Public directory does not exist yet at: ${publicDir}${Colors.reset}`);
  }

  const healthMonitor = new HealthMonitor({
    serviceName: ServerConfig.health.serviceName,
    version: ServerConfig.health.version,
    thresholds: ServerConfig.health.thresholds
  });

  // Pluggable Check: Verify static public directory accessibility
  healthMonitor.registerCheck('publicAssets', async () => {
    try {
      await fs.promises.access(publicDir, fs.constants.R_OK);
      return {
        status: HealthStatus.UP,
        message: 'Public assets directory readable'
      };
    } catch (err) {
      return {
        status: HealthStatus.DEGRADED,
        message: `Public assets directory inaccessible: ${err.message}`
      };
    }
  }, { critical: false });

  // Pluggable Check: Verify physics engine / level assets presence
  healthMonitor.registerCheck('levelSystem', async () => {
    const levelsDir = ServerConfig.paths.levels;
    try {
      if (fs.existsSync(levelsDir)) {
        const files = await fs.promises.readdir(levelsDir);
        return {
          status: HealthStatus.UP,
          details: { levelsFound: files.length },
          message: `Level system online (${files.length} level files located)`
        };
      }
      return {
        status: HealthStatus.UP,
        details: { levelsFound: 0 },
        message: 'Levels directory initialized in standby mode'
      };
    } catch (err) {
      return {
        status: HealthStatus.DEGRADED,
        message: `Level directory error: ${err.message}`
      };
    }
  }, { critical: false });

  const staticHandler = createStaticFileHandler(publicDir);

  const server = http.createServer(async (req, res) => {
    try {
      // First try Health Check / Telemetry routes
      const handledByHealth = await healthMonitor.handleHttpRequest(req, res);
      if (handledByHealth) {
        return;
      }

      // Fallback to static asset serving
      staticHandler(req, res);
    } catch (err) {
      console.error(`${Colors.red}Internal Server Error during request ${req.url}:${Colors.reset}`, err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  });

  server.listen(port, host, () => {
    const baseUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
    console.log(`${Colors.green}${Colors.bright}✓ B2.st Mario Server successfully listening!${Colors.reset}`);
    console.log(`\n  ${Colors.bright}Web Shell & Game:${Colors.reset}       ${Colors.cyan}${baseUrl}/${Colors.reset}`);
    console.log(`  ${Colors.bright}Health Diagnostic:${Colors.reset}      ${Colors.cyan}${baseUrl}/health${Colors.reset}`);
    console.log(`  ${Colors.bright}Liveness Probe:${Colors.reset}         ${Colors.cyan}${baseUrl}/health/liveness${Colors.reset}`);
    console.log(`  ${Colors.bright}Readiness Probe:${Colors.reset}        ${Colors.cyan}${baseUrl}/health/readiness${Colors.reset}`);
    console.log(`  ${Colors.bright}Prometheus Metrics:${Colors.reset}     ${Colors.cyan}${baseUrl}/metrics${Colors.reset}\n`);
    console.log(`  ${Colors.dim}Serving directory: ${publicDir}${Colors.reset}`);
    console.log(`  ${Colors.dim}Press Ctrl+C to terminate the engine server gracefully.${Colors.reset}\n`);
  });

  const gracefulShutdown = (signal) => {
    console.log(`\n${Colors.yellow}Received ${signal}. Shutting down Mario Engine server...${Colors.reset}`);
    healthMonitor.stop();
    server.close(() => {
      console.log(`${Colors.green}Server gracefully terminated. Goodbye!${Colors.reset}`);
      process.exit(0);
    });

    // Force exit if close hangs
    setTimeout(() => {
      console.error(`${Colors.red}Forced shutdown timed out. Exiting.${Colors.reset}`);
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

/**
 * Command: health
 * Runs local diagnostics or queries an active server endpoint.
 */
async function handleHealthCommand(flags) {
  const targetUrl = flags.url || flags.u;
  const format = flags.format || 'table';

  if (targetUrl) {
    console.log(`${Colors.cyan}Querying remote health endpoint: ${targetUrl}...${Colors.reset}`);
    try {
      const response = await fetch(targetUrl);
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
      process.exit(response.ok ? 0 : 1);
    } catch (err) {
      console.error(`${Colors.red}Failed to reach health endpoint:${Colors.reset} ${err.message}`);
      process.exit(1);
    }
    return;
  }

  // Local Health Inspection
  const monitor = new HealthMonitor({
    serviceName: ServerConfig.health.serviceName,
    version: ServerConfig.health.version
  });

  const report = await monitor.getHealthReport();
  monitor.stop();

  if (format === 'json') {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.status === HealthStatus.DOWN ? 1 : 0);
  }

  if (format === 'prometheus') {
    const prom = await monitor.getPrometheusMetrics();
    console.log(prom);
    process.exit(0);
  }

  // Table format for human-friendly terminal viewing
  console.log(BANNER);
  const statusColor = report.status === HealthStatus.UP
    ? Colors.green
    : report.status === HealthStatus.DEGRADED
    ? Colors.yellow
    : Colors.red;

  console.log(`System Status:  ${statusColor}${Colors.bright}${report.status}${Colors.reset}`);
  console.log(`Service:        ${report.service} (v${report.version})`);
  console.log(`Uptime:         ${report.uptimeSeconds} seconds`);
  console.log(`Platform:       ${report.system.platform} (${report.system.arch})`);
  console.log(`Node Version:   ${report.system.nodeVersion}`);
  console.log(`Heap Memory:    ${(report.system.processMemory.heapUsedBytes / 1024 / 1024).toFixed(2)} MB / ${(report.system.processMemory.heapTotalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Event Loop Lag: ${report.system.eventLoopLagMs} ms\n`);

  console.log(`${Colors.bright}Subsystem Checks:${Colors.reset}`);
  console.log('--------------------------------------------------------------------------------');
  for (const [checkName, meta] of Object.entries(report.checks)) {
    const sColor = meta.status === HealthStatus.UP
      ? Colors.green
      : meta.status === HealthStatus.DEGRADED
      ? Colors.yellow
      : Colors.red;
    const critTag = meta.critical ? `${Colors.magenta}[CRITICAL]${Colors.reset}` : `${Colors.dim}[OPTIONAL]${Colors.reset}`;
    console.log(` • ${checkName.padEnd(16)} [${sColor}${meta.status.padEnd(8)}${Colors.reset}] ${critTag} (${meta.durationMs}ms) - ${meta.message}`);
  }
  console.log('--------------------------------------------------------------------------------\n');

  process.exit(report.status === HealthStatus.DOWN ? 1 : 0);
}

/**
 * Command: validate-level
 * Validates a level map JSON file or scans the levels directory.
 */
async function handleValidateLevelCommand(flags, positionals) {
  const target = flags.path || flags.file || positionals[0] || ServerConfig.paths.levels;

  console.log(`${Colors.cyan}Inspecting level data at: ${target}${Colors.reset}\n`);

  if (!fs.existsSync(target)) {
    console.error(`${Colors.red}Target level path does not exist: ${target}${Colors.reset}`);
    process.exit(1);
  }

  const stat = fs.statSync(target);
  let filesToValidate = [];

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(target);
    filesToValidate = entries
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(target, f));

    if (filesToValidate.length === 0) {
      console.log(`${Colors.yellow}No .json level files found in directory: ${target}${Colors.reset}`);
      process.exit(0);
    }
  } else {
    filesToValidate = [target];
  }

  let hasError = false;

  for (const file of filesToValidate) {
    const relName = path.relative(ROOT_DIR, file);
    try {
      const content = fs.readFileSync(file, 'utf8');
      const json = JSON.parse(content);
      const result = validateLevelStructure(json);

      if (result.valid) {
        console.log(` ${Colors.green}✓ PASS${Colors.reset} ${relName} (${json.width}x${json.height}, tileSize: ${json.tileSize}px)`);
      } else {
        hasError = true;
        console.log(` ${Colors.red}✗ FAIL${Colors.reset} ${relName}:`);
        for (const issue of result.issues) {
          console.log(`    - ${Colors.yellow}${issue}${Colors.reset}`);
        }
      }
    } catch (err) {
      hasError = true;
      console.log(` ${Colors.red}✗ SYNTAX ERROR${Colors.reset} ${relName}: ${err.message}`);
    }
  }

  console.log();
  process.exit(hasError ? 1 : 0);
}

/**
 * Command: test
 * Discovers and runs project automated tests with test runner output.
 */
async function handleTestCommand(flags) {
  console.log(`${Colors.cyan}${Colors.bright}Running B2.st Mario Engine Test Suite...${Colors.reset}\n`);
  const testsDir = ServerConfig.paths.tests;

  if (!fs.existsSync(testsDir)) {
    console.error(`${Colors.red}Tests directory not found: ${testsDir}${Colors.reset}`);
    process.exit(1);
  }

  const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));
  if (testFiles.length === 0) {
    console.log(`${Colors.yellow}No test files found in ${testsDir}${Colors.reset}`);
    process.exit(0);
  }

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const startTime = performance.now();

  for (const file of testFiles) {
    const fullPath = path.join(testsDir, file);
    console.log(`${Colors.bright}Testing Suite:${Colors.reset} ${file}`);

    try {
      const module = await import(`file://${fullPath}`);
      if (typeof module.runTests === 'function') {
        const suiteResult = await module.runTests();
        totalTests += suiteResult.total || 0;
        passedTests += suiteResult.passed || 0;
        failedTests += suiteResult.failed || 0;
      } else {
        console.log(`  ${Colors.dim}- Module loaded successfully (declarative tests executed)${Colors.reset}`);
      }
    } catch (err) {
      failedTests++;
      totalTests++;
      console.error(`  ${Colors.red}✗ Suite execution failed:${Colors.reset} ${err.message}`);
      if (err.stack) console.error(err.stack);
    }
  }

  const duration = (performance.now() - startTime).toFixed(2);
  console.log('\n--------------------------------------------------------------------------------');
  console.log(`Total: ${totalTests} | ${Colors.green}Passed: ${passedTests}${Colors.reset} | ${failedTests > 0 ? Colors.red : Colors.dim}Failed: ${failedTests}${Colors.reset} | Duration: ${duration}ms`);
  console.log('--------------------------------------------------------------------------------\n');

  process.exit(failedTests > 0 ? 1 : 0);
}

/**
 * Prints CLI Help Manual
 */
function printHelp() {
  console.log(BANNER);
  console.log(`${Colors.bright}USAGE:${Colors.reset}`);
  console.log('  node src/cli.js <command> [options]\n');
  console.log(`${Colors.bright}COMMANDS:${Colors.reset}`);
  console.log(`  ${Colors.cyan}serve${Colors.reset}            Starts HTTP web shell server and health endpoints`);
  console.log(`  ${Colors.cyan}health${Colors.reset}           Inspects system health, memory, and telemetry in terminal`);
  console.log(`  ${Colors.cyan}test${Colors.reset}             Executes all unit and integration test suites`);
  console.log(`  ${Colors.cyan}validate-level${Colors.reset}   Verifies JSON level structure, tilemap integrity and spawns`);
  console.log(`  ${Colors.cyan}help${Colors.reset}             Displays this CLI help guide\n`);
  console.log(`${Colors.bright}OPTIONS:${Colors.reset}`);
  console.log('  -p, --port <num>      Port to listen on (default: 3000)');
  console.log('  -h, --host <host>     Network host to bind to (default: 127.0.0.1)');
  console.log('  -u, --url <url>       Target server URL for remote health check inspection');
  console.log('  --format <type>       Output format: table | json | prometheus (default: table)');
  console.log('  --path <path>         Path to level file or directory for validate-level\n');
  console.log(`${Colors.bright}EXAMPLES:${Colors.reset}`);
  console.log('  $ node src/cli.js serve --port 8080');
  console.log('  $ node src/cli.js health --format json');
  console.log('  $ node src/cli.js validate-level --path src/levels/world1_1.json');
  console.log('  $ node src/cli.js test\n');
}

/**
 * CLI Entry Router
 */
export async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args.command || 'help';

  switch (command) {
    case 'serve':
    case 'start':
      await handleServeCommand(args.flags);
      break;

    case 'health':
    case 'status':
      await handleHealthCommand(args.flags);
      break;

    case 'validate-level':
    case 'lint-level':
      await handleValidateLevelCommand(args.flags, args.positionals);
      break;

    case 'test':
      await handleTestCommand(args.flags);
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      process.exit(0);
      break;

    case 'version':
    case '--version':
    case '-v':
      console.log(`B2.st Mario CLI version ${ServerConfig.health.version}`);
      process.exit(0);
      break;

    default:
      console.error(`${Colors.red}Unknown command: "${command}"${Colors.reset}`);
      console.log(`Run ${Colors.cyan}node src/cli.js help${Colors.reset} for available commands.`);
      process.exit(2);
  }
}

// Execute when called directly from terminal
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main().catch((err) => {
    console.error(`${Colors.red}Fatal CLI error:${Colors.reset}`, err);
    process.exit(1);
  });
}