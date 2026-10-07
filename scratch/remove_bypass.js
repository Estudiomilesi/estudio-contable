const fs = require('fs');
let c = fs.readFileSync('src/app/api/cron/avisos-deuda/route.ts', 'utf8');
c = c.replace(/ \|\| url\.searchParams\.get\(\\'bypass\\'\) === \\'yes_test\\'/g, '');
fs.writeFileSync('src/app/api/cron/avisos-deuda/route.ts', c);
