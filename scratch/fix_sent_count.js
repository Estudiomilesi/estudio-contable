const fs = require('fs');
let c = fs.readFileSync('src/app/api/cron/avisos-deuda/route.ts', 'utf8');
const firstIndex = c.indexOf('let sentCount = 0;');
if (firstIndex !== -1) {
    const after = c.slice(firstIndex + 18).replace(/let sentCount = 0;/g, '');
    c = c.slice(0, firstIndex + 18) + after;
}
fs.writeFileSync('src/app/api/cron/avisos-deuda/route.ts', c);
