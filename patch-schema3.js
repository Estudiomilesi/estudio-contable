const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Undo the first mistake
schema = schema.replace(
  'amount       Float\n  isEcheq      Boolean              @default(false)',
  'amount       Float'
);

// Add to Check properly
const target = `model Check {
  id           String               @id @default(cuid())
  number       String
  bank         String
  issueDate    DateTime             @default(now())
  dueDate      DateTime
  amount       Float`;

const replacement = `model Check {
  id           String               @id @default(cuid())
  number       String
  bank         String
  issueDate    DateTime             @default(now())
  dueDate      DateTime
  amount       Float
  isEcheq      Boolean              @default(false)`;

schema = schema.replace(target, replacement);

fs.writeFileSync('prisma/schema.prisma', schema);
