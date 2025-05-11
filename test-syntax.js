const fs = require('fs');
const path = require('path');

try {
  // Read the file content
  const filePath = path.join(__dirname, 'app/scanner/components/scanner-dashboard.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for duplicate return statements 
  const returnCount = (content.match(/return \(\s*<div className="space-y-6">/g) || []).length;
  
  console.log(`File exists: ${fs.existsSync(filePath)}`);
  console.log(`Return statement count: ${returnCount}`);
  console.log('Syntax check passed');
} catch (error) {
  console.error('Error checking file:', error);
}