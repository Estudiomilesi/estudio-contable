const fs = require('fs');
let route = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');
route = route.replace(
  '<strong>${labelTotal}: ${tx.amount.toLocaleString(',
  '<strong>${labelTotal}: $${tx.amount.toLocaleString('
);
fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', route);
