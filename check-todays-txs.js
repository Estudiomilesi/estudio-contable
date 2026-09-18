const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const txs = await prisma.treasuryTransaction.findMany({
    where: {
      type: 'EXPENSE',
      category: 'Sueldos',
      date: { gte: new Date('2026-09-18T00:00:00Z') }
    },
    include: { salaries: true, employee: true }
  });

  console.dir(txs.map(tx => ({
    id: tx.id,
    amount: tx.amount,
    employee: tx.employee?.name,
    salaries: tx.salaries.map(s => s.month)
  })), { depth: null });
}

check().catch(console.error).finally(() => prisma.$disconnect());
