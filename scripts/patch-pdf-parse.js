const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'node_modules', 'pdf-parse', 'index.js');

if (fs.existsSync(targetPath)) {
  let content = fs.readFileSync(targetPath, 'utf8');
  content = content.replace('let isDebugMode = !module.parent;', 'let isDebugMode = false;');
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Patched pdf-parse successfully!');
} else {
  console.log('pdf-parse not found, skipping patch.');
}
