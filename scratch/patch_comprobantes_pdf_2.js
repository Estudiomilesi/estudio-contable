const fs = require('fs');

let c = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');

// remove generatePdfDoc
c = c.replace(/  const generatePdfDoc = async[\s\S]*?  return doc;\n  };\n/m, '');

// import it
c = c.replace(
  /import QRCode from 'qrcode';/,
  `import QRCode from 'qrcode';\nimport { generatePdfDoc } from '@/lib/pdfGenerator';`
);

// update the call to generatePdfDoc
c = c.replace(
  /const doc = await generatePdfDoc\(c\);/g,
  `const doc = await generatePdfDoc(c, bancos);`
);

fs.writeFileSync('src/app/comprobantes/page.tsx', c);
