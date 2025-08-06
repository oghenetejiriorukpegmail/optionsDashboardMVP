#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Get port from environment or default to 3000
const port = process.env.PORT || '3000';

console.log(`Starting Next.js production server on port ${port}...`);

// Spawn the Next.js start process
const child = spawn('npx', ['next', 'start', '-p', port], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error(`Failed to start production server: ${error.message}`);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code);
});