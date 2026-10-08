const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema += '\n\nmodel ClientNote {\n  id        String   @id @default(cuid())\n  clientId  String\n  client    Client   @relation(fields: [clientId], references: [id])\n  content   String\n  createdBy String\n  createdAt DateTime @default(now())\n}\n';
schema = schema.replace('accountTransactions AccountTransaction[]', 'accountTransactions AccountTransaction[]\n  notes              ClientNote[]');
fs.writeFileSync('prisma/schema.prisma', schema);
