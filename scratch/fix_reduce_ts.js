const fs = require('fs');
let c = fs.readFileSync('src/app/api/cron/avisos-deuda/route.ts', 'utf8');
c = c.replace(/\(sum, app\)/g, '(sum: number, app: any)');
fs.writeFileSync('src/app/api/cron/avisos-deuda/route.ts', c);

let d = fs.readFileSync('src/app/api/cuentas-corrientes/enviar-reporte/route.ts', 'utf8');
d = d.replace(/\(sum, app\)/g, '(sum: number, app: any)');
fs.writeFileSync('src/app/api/cuentas-corrientes/enviar-reporte/route.ts', d);
