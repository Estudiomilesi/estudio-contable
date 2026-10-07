const fs = require('fs');
let c = fs.readFileSync('src/middleware.ts', 'utf8');
c = c.replace(
  "request.nextUrl.pathname.startsWith('/api/auth') ||", 
  "request.nextUrl.pathname.startsWith('/api/auth') ||\n    request.nextUrl.pathname.startsWith('/api/cron') ||"
);
fs.writeFileSync('src/middleware.ts', c);
