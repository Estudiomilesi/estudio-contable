const fs = require('fs');

let c = fs.readFileSync('src/app/api/clientes/route.ts', 'utf8');
c = c.replace(
  /        hasAbono: data.hasAbono \?\? true,/,
  `        hasAbono: data.hasAbono ?? true,\n        wantsPdfAttachment: data.wantsPdfAttachment ?? false,`
);
fs.writeFileSync('src/app/api/clientes/route.ts', c);

let c2 = fs.readFileSync('src/app/api/clientes/[id]/route.ts', 'utf8');
c2 = c2.replace(
  /        hasAbono: data.hasAbono !== undefined \? data.hasAbono : existingCliente.hasAbono,/,
  `        hasAbono: data.hasAbono !== undefined ? data.hasAbono : existingCliente.hasAbono,\n        wantsPdfAttachment: data.wantsPdfAttachment !== undefined ? data.wantsPdfAttachment : existingCliente.wantsPdfAttachment,`
);
fs.writeFileSync('src/app/api/clientes/[id]/route.ts', c2);
