const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('isEcheq')) {
  schema = schema.replace(
    /model Check \{[^}]*amount\s+Float/,
    (match) => match + '\n  isEcheq      Boolean              @default(false)'
  );
  fs.writeFileSync('prisma/schema.prisma', schema);
}
