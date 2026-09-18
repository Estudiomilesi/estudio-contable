const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const salariesRaw = await prisma.salary.findMany({
    where: { month: '2026-09' },
    include: { employee: true, treasuryTxs: true }
  });

  const salaries = salariesRaw.map(s => {
    const paidAmount = s.treasuryTxs.reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const effectivePaidAmount = s.isPaid && paidAmount === 0 ? s.amount : paidAmount;
    const pendingAmount = Math.max(0, s.amount - effectivePaidAmount);
    const isFullyPaid = pendingAmount <= 1;

    return {
      employee: s.employee.name,
      amount: s.amount,
      paidAmount: effectivePaidAmount,
      pendingAmount,
      isPaid: isFullyPaid,
      txs: s.treasuryTxs.length
    };
  });
  
  console.dir(salaries, { depth: null });
}

check().catch(console.error).finally(() => prisma.$disconnect());
