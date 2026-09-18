const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const salaries = await prisma.salary.findMany({
    include: { employee: true, treasuryTxs: true }
  });
  console.dir(salaries.map(s => ({ 
    id: s.id, 
    employee: s.employee.name, 
    month: s.month, 
    amount: s.amount, 
    isPaid: s.isPaid, 
    txs: s.treasuryTxs.length,
    paidAmount: s.treasuryTxs.reduce((acc, tx) => acc + Math.abs(tx.amount), 0)
  })), { depth: null });
}

check().catch(console.error).finally(() => prisma.$disconnect());
