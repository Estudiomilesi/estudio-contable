const fs = require('fs');
let c = fs.readFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', 'utf8');

c = c.replace(
  /paymentsApplied: \{\s*include: \{\s*charge: true\s*\}\s*\}/g,
  `chargesCovered: {\n          include: {\n            charge: true\n          }\n        }`
);

c = c.replace(
  /for \(const app of tx\.paymentsApplied\) \{/g,
  `for (const app of tx.chargesCovered) {`
);

fs.writeFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', c);
