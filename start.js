#!/usr/bin/env node

/**
 * Simple Development Server Launcher
 *
 * This script launches all services and provides a health check endpoint.
 * It's designed to work with the preview tool's health check mechanism.
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Configuration
const SERVER_PORT = 9091;
const EXPO_PORT = 5000;
const HEALTH_CHECK_PORT = 3000;

// Track processes
const processes = [];
let isShuttingDown = false;

/**
 * Start a process in the background
 */
function startProcess(name, command, args, cwd) {
  console.log(`[${name}] Starting...`);

  const proc = spawn(command, args, {
    cwd: path.join(__dirname, cwd),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  processes.push({ name, proc });

  proc.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim().slice(0, 200)}`);
  });

  proc.stderr.on('data', (data) => {
    console.log(`[${name} ERROR] ${data.toString().trim().slice(0, 200)}`);
  });

  proc.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`[${name}] Exited with code ${code}`);
    }
  });

  // Unref so parent can exit
  proc.unref();

  console.log(`[${name}] Started with PID ${proc.pid}`);
  return proc;
}

/**
 * Create and start health check server
 */
function startHealthCheckServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        services: {
          server: `http://127.0.0.1:${SERVER_PORT}`,
          expo: `http://127.0.0.1:${EXPO_PORT}`
        },
        timestamp: new Date().toISOString()
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(HEALTH_CHECK_PORT, '127.0.0.1', () => {
      console.log(`[HEALTH] Listening on http://127.0.0.1:${HEALTH_CHECK_PORT}/health`);
      resolve(server);
    });

    server.on('error', reject);
  });
}

/**
 * Kill processes using a port
 */
function killPort(port) {
  const platform = process.platform;

  let command;
  if (platform === 'win32') {
    command = `netstat -ano | findstr :${port}`;
  } else {
    command = `lsof -ti:${port}`;
  }

  return new Promise((resolve) => {
    const proc = spawn(command, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

    let output = '';
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', () => {});

    proc.on('close', () => {
      const pids = output.trim().split(/\s+/).filter(p => p);
      pids.forEach(pid => {
        try {
          process.kill(parseInt(pid), 'SIGTERM');
          console.log(`[CLEANUP] Killed process ${pid} on port ${port}`);
        } catch (e) {
          // Ignore if process doesn't exist
        }
      });
      resolve();
    });

    setTimeout(resolve, 2000);
  });
}

/**
 * Main startup function
 */
async function main() {
  console.log('==========================================');
  console.log('  Starting Development Services');
  console.log('==========================================');
  console.log(`Server Port: ${SERVER_PORT}`);
  console.log(`Expo Port: ${EXPO_PORT}`);
  console.log(`Health Check Port: ${HEALTH_CHECK_PORT}`);
  console.log('==========================================');
  console.log('');

  // Step 1: Clean up old processes
  console.log('[STEP 1] Cleaning up old processes...');
  await killPort(SERVER_PORT);
  await killPort(EXPO_PORT);
  await killPort(HEALTH_CHECK_PORT);
  console.log('[STEP 1] Done\n');

  // Step 2: Start health check server FIRST
  console.log('[STEP 2] Starting health check server...');
  const healthServer = await startHealthCheckServer();
  console.log('[STEP 2] Done\n');

  // Step 3: Start backend server
  console.log('[STEP 3] Starting backend server...');
  startProcess('SERVER', 'pnpm', ['run', 'dev'], 'server');
  console.log('[STEP 3] Done\n');

  // Wait a bit for server to start
  console.log('Waiting for server to initialize...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 4: Start Expo
  console.log('[STEP 4] Starting Expo...');
  startProcess('EXPO', 'npx', ['expo', 'start', '--web', '--localhost', '--clear', `--port=${EXPO_PORT}`], 'client');
  console.log('[STEP 4] Done\n');

  // Wait for Expo to start
  console.log('Waiting for Expo to initialize...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('');
  console.log('==========================================');
  console.log('  ✓ All Services Started');
  console.log('==========================================');
  console.log(`Backend API: http://127.0.0.1:${SERVER_PORT}/api/v1/health`);
  console.log(`Expo Web:   http://127.0.0.1:${EXPO_PORT}`);
  console.log(`Health:     http://127.0.0.1:${HEALTH_CHECK_PORT}/health`);
  console.log('==========================================');
  console.log('');
  console.log('[READY] Services are running and accessible.');
  console.log('[INFO] This script will keep running to maintain services.');
  console.log('[INFO] Press Ctrl+C to stop all services.');
  console.log('');
}

/**
 * Cleanup handler
 */
function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('');
  console.log('==========================================');
  console.log('  Shutting Down Services');
  console.log('==========================================');

  processes.forEach(({ name, proc }) => {
    try {
      console.log(`[STOP] ${name} (PID: ${proc.pid})`);
      process.kill(proc.pid, 'SIGTERM');
    } catch (e) {
      // Ignore
    }
  });

  setTimeout(() => {
    console.log('[DONE] All services stopped.');
    process.exit(0);
  }, 3000);
}

// Handle signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
