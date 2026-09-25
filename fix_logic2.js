const fs = require('fs');

let tRoute = fs.readFileSync('src/app/api/tesoreria/route.ts', 'utf-8');
tRoute = tRoute.replace(
  'clientId: data.clientId || null',
  'clientId: data.clientId || null,\n              parentTransactionId: nuevaTransaccion.id'
);
fs.writeFileSync('src/app/api/tesoreria/route.ts', tRoute);
