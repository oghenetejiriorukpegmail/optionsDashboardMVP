// Simple diagnostic script to check for common issues
const fs = require('fs');
const path = require('path');

console.log('Running diagnostics for options-technical-hybrid-strategy-scanner...\n');

// Check essential files
const essentialFiles = [
  'next.config.js', 
  'package.json', 
  'tailwind.config.js', 
  'app/layout.tsx', 
  'app/page.tsx',
  'components/ui/button.tsx',
  'components/ui/header.tsx',
  'app/globals.css',
];

console.log('Checking essential files:');
let allFilesExist = true;
essentialFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Some essential files are missing. Please check the above list.');
} else {
  console.log('\n✅ All essential files present.');
}

// Check package.json for required dependencies
const packageJson = require('./package.json');
const requiredDeps = [
  'next', 
  'react', 
  'react-dom',
  'next-themes',
  'sonner',
  '@radix-ui/react-slot',
  '@radix-ui/react-tabs'
];

console.log('\nChecking required dependencies:');
let allDepsExist = true;
requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies[dep] !== undefined;
  console.log(`${exists ? '✅' : '❌'} ${dep}`);
  if (!exists) allDepsExist = false;
});

if (!allDepsExist) {
  console.log('\n❌ Some required dependencies are missing. Run "npm install" to fix.');
} else {
  console.log('\n✅ All required dependencies present.');
}

// Check Node.js version compatibility
const nodeVersion = process.version;
console.log(`\nNode.js version: ${nodeVersion}`);
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (majorVersion < 16) {
  console.log('❌ Node.js version may be too old. Next.js 14 requires Node.js 16.14 or later.');
} else {
  console.log('✅ Node.js version is compatible with Next.js 14.');
}

// Check for potential CSS issues
const cssContent = fs.readFileSync(path.join(__dirname, 'app/globals.css'), 'utf8');
if (cssContent.includes('@custom-variant') || cssContent.includes('@theme inline')) {
  console.log('\n❌ Potentially problematic CSS directives found in globals.css.');
} else {
  console.log('\n✅ No problematic CSS directives found.');
}

console.log('\nDiagnostic check complete. If issues persist, try:');
console.log('1. rm -rf node_modules .next');
console.log('2. npm install');
console.log('3. npm run dev');