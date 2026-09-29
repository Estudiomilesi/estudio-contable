const fs = require('fs');
let page = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf-8');

page = page.replace(
  'clientes={clientes}',
  'clientes={clientes}\n          conceptos={billingConcepts}'
);

fs.writeFileSync('src/app/comprobantes/page.tsx', page);
