const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.treasuryTransaction.groupBy({
    by: ['category'],
    where: { type: 'EXPENSE' },
    _count: { _all: true },
    _sum: { amount: true }
  });
  console.log('Expense Categories:', expenses);
}

main().catch(console.error).finally(() => prisma.$disconnect());
