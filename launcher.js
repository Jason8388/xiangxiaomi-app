#!/usr/bin/env node

/**
 * Development Launcher
 *
 * This launcher starts both the backend server and Expo,
 * then keeps the Expo process in the foreground.
 */

const { spawn } = require('child_process');
const path = require('path');

const ROOT_DIR = __dirname;
const SERVER_PORT = 9091;
const EXPO_PORT = 5000;

console.log('==========================================');
console.log('  Starting Development Services');
console.log('==========================================');
console.log(`Server Port: ${SERVER_PORT}`);
console.log(`Expo Port: ${EXPO_PORT}`);
console.log('==========================================\n');

// Function to spawn a process
function spawnProcess(name, command, args, cwd, env) {
  console.log(`[${name}] Starting...`);

  const envVars = {
    ...process.env,
    ...env
  };

  const proc = spawn(command, args, {
    cwd: path.join(ROOT_DIR, cwd),
    stdio: 'inherit',
    env: envVars,
    shell: true
  });

  proc.on('error', (err) => {
    console.error(`[${name}] Error:`, err.message);
  });

  proc.on('exit', (code) => {
    console.log(`[${name}] Exited with code ${code}`);
  });

  console.log(`[${name}] Started with PID ${proc.pid}`);
  return proc;
}

// Start backend server in background
console.log('[STEP 1] Starting backend server...');
const serverEnv = {
  NODE_ENV: 'development',
  PORT: SERVER_PORT.toString(),
  DB_HOST: process.env.DB_HOST || '172.36.0.169',
  DB_PORT: process.env.DB_PORT || '59833',
  DB_NAME: process.env.DB_NAME || 'postgres',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres'
};

const serverProc = spawnProcess('SERVER', 'npx', ['tsx', 'watch', './src/index.ts'], 'server', serverEnv);

// Wait for server to initialize
console.log('[INFO] Waiting for server to initialize...');
setTimeout(() => {
  // Start Expo in foreground
  console.log('[STEP 2] Starting Expo Web...');
  const expoEnv = {
    EXPO_PUBLIC_BACKEND_BASE_URL: `http://127.0.0.1:${SERVER_PORT}`
  };

  const expoProc = spawnProcess('EXPO', 'npx', ['expo', 'start', '--web', '--localhost', '--clear', `--port=${EXPO_PORT}`], 'client', expoEnv);

  console.log('\n==========================================');
  console.log('  ✓ All Services Started');
  console.log('==========================================');
  console.log(`Server: http://127.0.0.1:${SERVER_PORT}`);
  console.log(`Expo:   http://127.0.0.1:${EXPO_PORT}`);
  console.log('==========================================\n');

  // Handle cleanup on exit
  const cleanup = () => {
    console.log('\n[INFO] Shutting down services...');
    serverProc.kill('SIGTERM');
    expoProc.kill('SIGTERM');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Keep the process running (Expo is already in foreground)
}, 5000);
