const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(
  'amount       Float\n  status',
  'amount       Float\n  isEcheq      Boolean              @default(false)\n  status'
);

fs.writeFileSync('prisma/schema.prisma', schema);
