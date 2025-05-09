// Fix import paths for UI components
const fs = require('fs');
const path = require('path');

// Define the directories to search
const directories = [
  path.join(__dirname, 'components', 'confirmation'),
  path.join(__dirname, 'components', 'key-levels'),
  path.join(__dirname, 'components', 'market-context'),
  path.join(__dirname, 'components', 'risk-management'),
  path.join(__dirname, 'components', 'scanner'),
  path.join(__dirname, 'components', 'trade-setup'),
  path.join(__dirname, 'app', 'scanner')
];

// Define the import pattern to search for
const importPattern = /@\/components\/ui\/([a-zA-Z-]+)/g;

// Function to process a file
function processFile(filePath) {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if it contains @/components/ui imports
  if (content.includes('@/components/ui')) {
    console.log(`Processing ${filePath}`);
    
    // Update the imports to use relative paths
    const updatedContent = content.replace(importPattern, (match, componentName) => {
      // Determine the relative path from the file to the components/ui directory
      const relativePathToComponents = path.relative(
        path.dirname(filePath),
        path.join(__dirname, 'components', 'ui')
      ).replace(/\\/g, '/');
      
      return `${relativePathToComponents}/${componentName}`;
    });
    
    // Write the updated content back to the file if changes were made
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`Fixed imports in ${filePath}`);
    }
  }
}

// Recursively process a directory
function processDirectory(dirPath) {
  // Get all files in the directory
  const files = fs.readdirSync(dirPath);
  
  // Process each file or subdirectory
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Process subdirectories recursively
      processDirectory(filePath);
    } else if (stats.isFile() && (filePath.endsWith('.tsx') || filePath.endsWith('.ts'))) {
      // Process TypeScript files
      processFile(filePath);
    }
  }
}

// Process all directories
for (const dir of directories) {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  } else {
    console.log(`Directory not found: ${dir}`);
  }
}

console.log('Import path fixing complete!');
