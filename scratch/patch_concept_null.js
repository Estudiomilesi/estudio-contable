const fs = require('fs');

let c = fs.readFileSync('src/app/api/comprobantes/enviar-html/route.ts', 'utf8');

c = c.replace(
  /conceptoStr = tx\.description\.replace\(matchPeriodo\[0\], ''\)\.trim\(\);/,
  `conceptoStr = (tx.description || '').replace(matchPeriodo[0], '').trim();`
);

fs.writeFileSync('src/app/api/comprobantes/enviar-html/route.ts', c);
