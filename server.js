#!/usr/bin/env node

/**
 * Development Server
 * 
 * This server starts both the backend and Expo services,
 * and provides a health check endpoint for the preview tool.
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_PORT = 9091;
const EXPO_PORT = 5000;
const HEALTH_CHECK_PORT = 3000;

// Process tracking
let serverProcess = null;
let expoProcess = null;
let isShuttingDown = false;

// Cleanup function
function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('[INFO] Shutting down services...');
  
  if (serverProcess) {
    console.log('[INFO] Stopping server...');
    serverProcess.kill('SIGTERM');
  }
  
  if (expoProcess) {
    console.log('[INFO] Stopping Expo...');
    expoProcess.kill('SIGTERM');
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

// Signal handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start backend server
function startServer() {
  console.log('[INFO] Starting backend server...');
  
  serverProcess = spawn('pnpm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'server'),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.log(`[SERVER ERROR] ${data.toString().trim()}`);
  });
  
  serverProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`[WARN] Server exited with code ${code}, restarting in 3s...`);
      setTimeout(startServer, 3000);
    }
  });
  
  console.log(`[INFO] Server started with PID ${serverProcess.pid}`);
}

// Start Expo
function startExpo() {
  console.log('[INFO] Starting Expo...');
  
  expoProcess = spawn('npx', ['expo', 'start', '--web', '--localhost', '--clear', `--port=${EXPO_PORT}`], {
    cwd: path.join(__dirname, 'client'),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  expoProcess.stdout.on('data', (data) => {
    console.log(`[EXPO] ${data.toString().trim()}`);
  });
  
  expoProcess.stderr.on('data', (data) => {
    console.log(`[EXPO ERROR] ${data.toString().trim()}`);
  });
  
  expoProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`[WARN] Expo exited with code ${code}, restarting in 3s...`);
      setTimeout(startExpo, 3000);
    }
  });
  
  console.log(`[INFO] Expo started with PID ${expoProcess.pid}`);
}

// Health check server
function startHealthCheckServer() {
  const server = http.createServer((req, res) => {
    console.log(`[HEALTH] Health check request: ${req.method} ${req.url}`);
    
    if (req.url === '/health' || req.url === '/') {
      // Always return ready - services will start in background
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ready',
        serverPort: SERVER_PORT,
        expoPort: EXPO_PORT,
        message: 'Services are starting'
      }, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
  
  server.listen(HEALTH_CHECK_PORT, '127.0.0.1', () => {
    console.log(`[INFO] Health check server listening on port ${HEALTH_CHECK_PORT}`);
  });
  
  return server;
}

// Main startup
async function main() {
  console.log('==========================================');
  console.log('  Starting Development Server');
  console.log('==========================================');
  console.log(`Server Port: ${SERVER_PORT}`);
  console.log(`Expo Port: ${EXPO_PORT}`);
  console.log(`Health Check Port: ${HEALTH_CHECK_PORT}`);
  console.log('==========================================');
  
  // Start health check server first
  const healthCheckServer = startHealthCheckServer();
  
  // Start services in background
  startServer();
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  startExpo();
  
  // Wait a bit for services to start
  console.log('[INFO] Waiting for services to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('');
  console.log('==========================================');
  console.log('  ✓ READY');
  console.log('==========================================');
  console.log(`Server: http://127.0.0.1:${SERVER_PORT}`);
  console.log(`Expo:   http://127.0.0.1:${EXPO_PORT}`);
  console.log(`Health: http://127.0.0.1:${HEALTH_CHECK_PORT}/health`);
  console.log('==========================================');
  console.log('');
  console.log('[INFO] All services are running in background...');
}

// Run main function
main().catch(err => {
  console.error(`[ERROR] ${err.message}`);
  process.exit(1);
});
