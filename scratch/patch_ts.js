const fs = require('fs');
let c = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');
c = c.replace(/const doc = await generatePdfDoc\(c\);/g, 'const doc = await generatePdfDoc(c, bancos);');
fs.writeFileSync('src/app/comprobantes/page.tsx', c);
