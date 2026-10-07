const fs = require('fs');
let c = fs.readFileSync('src/app/api/cron/avisos-deuda/route.ts', 'utf8');
c = c.replace(
  /<td style="padding: 10px; text-align: right; color: #0f172a; font-weight: bold;">\$\$\{tx\.runningBalance\.toLocaleString\('es-AR', \{minimumFractionDigits: 2, maximumFractionDigits: 2\}\)\}<\/td>/,
  '<td style="padding: 10px; text-align: right; color: #64748b; font-weight: bold;">-</td>'
);
fs.writeFileSync('src/app/api/cron/avisos-deuda/route.ts', c);
