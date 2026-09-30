const fs = require('fs');

let content = fs.readFileSync('src/lib/mailer.ts', 'utf8');

// Replace using regex that ignores the weird 'i' character
content = content.replace(/Juan Mart.n Milesi/g, 'Juan Martín Brigi');
// Also replace it if it's already Brigi with a weird char
content = content.replace(/Juan Mart.n Brigi/g, 'Juan Martín Brigi');

fs.writeFileSync('src/lib/mailer.ts', content, 'utf8');
console.log('Fixed Juanma name in mailer.ts');
