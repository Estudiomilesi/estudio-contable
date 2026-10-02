const fs = require('fs');
let c = fs.readFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', 'utf8');
c = c.replace("\\`Recibo de Pago - \\${client.name}\\`", "\`Recibo de Pago - \${client.name}\`");
fs.writeFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', c);
