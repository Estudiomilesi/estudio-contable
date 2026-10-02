const fs = require('fs');
let c = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');
c = c.replace(/import QRCode from 'qrcode';/, `import QRCode from 'qrcode';\nimport { generatePdfDoc } from '@/lib/pdfGenerator';`);
c = c.replace(/const doc = await generatePdfDoc\(createdComp\);/g, 'const doc = await generatePdfDoc(createdComp, bancos);');
fs.writeFileSync('src/app/comprobantes/page.tsx', c);
