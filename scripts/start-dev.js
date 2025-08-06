#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Get port from environment or default to 3000
const port = process.env.PORT || '3000';

console.log(`Starting Next.js development server on port ${port}...`);

// Spawn the Next.js dev process
const child = spawn('npx', ['next', 'dev', '-p', port], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error(`Failed to start development server: ${error.message}`);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code);
});