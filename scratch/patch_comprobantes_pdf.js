const fs = require('fs');

let c = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');

// remove old generatePdfDoc
const start = c.indexOf('  const generatePdfDoc = async (c: Comprobante) => {');
const endStr = '    doc.text(c.client.professionalLabel === \'F\' ? "CP. Federico Milesi" : "CP. Federico Milesi - CP. Juan M. Brigi", 105, 282, { align: \'center\' });\n  }\n  \n  return doc;\n};';
const end = c.indexOf(endStr) + endStr.length;

if (start !== -1 && end !== -1) {
  c = c.substring(0, start) + c.substring(end);
}

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
