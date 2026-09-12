const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf-8');

schema = schema.replace(
  `  salaries       Salary[]\n  createdAt      DateTime             @default(now())`,
  `  salaries       Salary[]\n  \n  employeeId     String?\n  employee       Employee?            @relation(fields: [employeeId], references: [id])\n  \n  createdAt      DateTime             @default(now())`
);

schema = schema.replace(
  `  salaries  Salary[]\n  createdAt DateTime @default(now())`,
  `  salaries  Salary[]\n  treasuryTxs TreasuryTransaction[]\n  createdAt DateTime @default(now())`
);

fs.writeFileSync(schemaPath, schema);
