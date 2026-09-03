const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Add tabular-nums to right-aligned cells
      content = content.replace(/text-right([ \"])/g, 'text-right tabular-nums$1');
      
      // Fix toLocaleString
      content = content.replace(/\.toLocaleString\('es-AR'(?:, \{[^\}]+\})?\)/g, `.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})`);
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('./src');
console.log('Done!');
