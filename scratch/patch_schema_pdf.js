const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');
c = c.replace(/hasAbono\s+Boolean\s+@default\(true\)/, 'hasAbono          Boolean            @default(true)\n  wantsPdfAttachment Boolean          @default(false)');
fs.writeFileSync('prisma/schema.prisma', c);
