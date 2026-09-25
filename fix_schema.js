const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Replace in TreasuryTransaction model
schema = schema.replace(
  /model TreasuryTransaction \{([\s\S]*?)createdAt\s+DateTime\s+@default\(now\(\)\)\s*\}/,
  'model TreasuryTransaction {$1createdAt      DateTime             @default(now())\n\n  accountTransactionId String? @unique\n  accountTransaction   AccountTransaction? @relation(fields: [accountTransactionId], references: [id], onDelete: Cascade)\n}'
);

// Replace in AccountTransaction model
schema = schema.replace(
  '  items             AccountTransactionItem[]',
  '  items             AccountTransactionItem[]\n  treasuryTransaction TreasuryTransaction?'
);

fs.writeFileSync('prisma/schema.prisma', schema);
