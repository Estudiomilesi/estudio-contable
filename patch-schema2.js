const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(
  /amount\s+Float/,
  `amount       Float\n  isEcheq      Boolean              @default(false)`
);

fs.writeFileSync('prisma/schema.prisma', schema);
