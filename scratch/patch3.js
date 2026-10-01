const fs = require('fs'); 
let c = fs.readFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', 'utf8'); 
c = c.replace('incomingTxId: treasuryTx.id,', 'incomingTxId: treasuryTx.id,\n          isEcheq: checkDetails.isEcheq === true,'); 
fs.writeFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', c);
