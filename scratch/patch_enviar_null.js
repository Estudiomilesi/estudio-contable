const fs = require('fs');

let c = fs.readFileSync('src/app/api/comprobantes/enviar/route.ts', 'utf8');

c = c.replace(
  /conceptoStr = tx\.description\.replace\(matchConcepto\[0\], ''\)\.trim\(\);/,
  `conceptoStr = (tx.description || '').replace(matchConcepto[0], '').trim();`
);

fs.writeFileSync('src/app/api/comprobantes/enviar/route.ts', c);
