const fs = require('fs');

let c = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');

const start = c.indexOf('  const generatePdfDoc = async');
if (start !== -1) {
  const endMarker = '  return doc;\n  };';
  const end = c.indexOf(endMarker, start);
  if (end !== -1) {
    c = c.substring(0, start) + c.substring(end + endMarker.length);
  }
}

c = c.replace(/await generatePdfDoc\(createdComp\)/g, 'await generatePdfDoc(createdComp, bancos)');

fs.writeFileSync('src/app/comprobantes/page.tsx', c);
