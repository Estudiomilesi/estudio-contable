const fs = require('fs');
let c = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');

const startStr = '  const generatePdfDoc = async (c: Comprobante) => {';
const start = c.indexOf(startStr);
if (start !== -1) {
  const endMarker = 'return doc;\n  };';
  let end = c.indexOf(endMarker, start);
  if (end !== -1) {
    c = c.substring(0, start) + c.substring(end + endMarker.length);
    fs.writeFileSync('src/app/comprobantes/page.tsx', c);
    console.log("DELETED SUCCESSFULLY!");
  } else {
    console.log("END NOT FOUND");
  }
} else {
  console.log("START NOT FOUND");
}
