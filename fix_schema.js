const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(
  '  accountTransactionId String? @unique',
  `  parentTransactionId String?
  parentTransaction   TreasuryTransaction? @relation("LinkedTransactions", fields: [parentTransactionId], references: [id], onDelete: Cascade)
  childTransactions   TreasuryTransaction[] @relation("LinkedTransactions")

  accountTransactionId String? @unique`
);

fs.writeFileSync('prisma/schema.prisma', schema);
