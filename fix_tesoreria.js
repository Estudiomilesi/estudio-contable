const fs = require('fs');

let tRoute = fs.readFileSync('src/app/api/tesoreria/route.ts', 'utf-8');

tRoute = tRoute.replace(
  /description: `Retiro autom.*tico s\/ cobro \$\{data\.description \|\| ''\}`,\s*clientId: data\.clientId \|\| null\s*\}/g,
  'description: `Retiro automático s/ cobro ${data.description || \'\'}`,\n              clientId: data.clientId || null,\n              parentTransactionId: nuevaTransaccion.id\n            }'
);

tRoute = tRoute.replace(
  /description: `Retiro autom.*tico IVA s\/ cobro \$\{data\.description \|\| ''\}`,\s*clientId: data\.clientId \|\| null\s*\}/g,
  'description: `Retiro automático IVA s/ cobro ${data.description || \'\'}`,\n              clientId: data.clientId || null,\n              parentTransactionId: nuevaTransaccion.id\n            }'
);

tRoute = tRoute.replace(
  /description: `Reintegro autom.*tico por pago de gasto \$\{data\.description \|\| ''\}`,\s*clientId: data\.clientId \|\| null\s*\}/g,
  'description: `Reintegro automático por pago de gasto ${data.description || \'\'}`,\n              clientId: data.clientId || null,\n              parentTransactionId: nuevaTransaccion.id\n            }'
);

fs.writeFileSync('src/app/api/tesoreria/route.ts', tRoute);
