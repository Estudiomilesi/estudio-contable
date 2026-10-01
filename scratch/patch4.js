const fs = require('fs'); 
let c = fs.readFileSync('src/app/api/tesoreria/route.ts', 'utf8'); 
c = c.replace('incomingTxId: nuevaTransaccion.id', 'incomingTxId: nuevaTransaccion.id,\n            isEcheq: checkData.isEcheq === true'); 
fs.writeFileSync('src/app/api/tesoreria/route.ts', c);
