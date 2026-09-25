const fs = require('fs');

// 1. Fix tesoreria route
let tRoute = fs.readFileSync('src/app/api/tesoreria/route.ts', 'utf-8');
tRoute = tRoute.replace(
  /category: retiroSocio,\s*description: `Aporte\/Reintegro automático por pago de \$\{data\.category\}`,\s*\}/,
  'category: retiroSocio,\n              description: `Aporte/Reintegro automático por pago de ${data.category}`,\n              parentTransactionId: nuevaTransaccion.id\n            }'
);
fs.writeFileSync('src/app/api/tesoreria/route.ts', tRoute);

// 2. Fix sueldos/pagar route
let sRoute = fs.readFileSync('src/app/api/sueldos/pagar/route.ts', 'utf-8');
sRoute = sRoute.replace(
  /category: retiroSocio,\s*description: `Aporte\/Reintegro automático por pago de Sueldos`,\s*\}/,
  'category: retiroSocio,\n            description: `Aporte/Reintegro automático por pago de Sueldos`,\n            parentTransactionId: nuevaTransaccion.id\n          }'
);
fs.writeFileSync('src/app/api/sueldos/pagar/route.ts', sRoute);

// 3. Fix tesoreria UI (page.tsx)
let page = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf-8');
// Add parentTransactionId to TreasuryTransaction type
page = page.replace(
  'employeeId?: string | null;',
  'employeeId?: string | null;\n  parentTransactionId?: string | null;'
);
// Disable edit/delete if parentTransactionId exists
const editDeleteBtnRegex = /\{t\.createdAt && \(new Date\(\)\.getTime\(\) - new Date\(t\.createdAt\)\.getTime\(\)\) \/ \(1000 \* 3600 \* 24\) <= 5 && \(/;
page = page.replace(
  editDeleteBtnRegex,
  '{t.createdAt && !t.parentTransactionId && (new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24) <= 5 && ('
);
fs.writeFileSync('src/app/tesoreria/page.tsx', page);
