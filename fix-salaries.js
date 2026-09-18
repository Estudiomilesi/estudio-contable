const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const txs = await prisma.treasuryTransaction.findMany({
    where: {
      type: 'EXPENSE',
      category: 'Sueldos',
      employeeId: { not: null }
    },
    include: { salaries: true }
  });
  
  console.log(`Found ${txs.length} salary transactions.`);
  let fixed = 0;
  
  for (const tx of txs) {
    if (tx.salaries.length === 0) {
      console.log(`Fixing tx ${tx.id} for employee ${tx.employeeId}...`);
      const yyyy = tx.date.getFullYear();
      const mm = String(tx.date.getMonth() + 1).padStart(2, '0');
      const monthStr = `${yyyy}-${mm}`;
      
      await prisma.salary.upsert({
        where: {
          employeeId_month: {
            employeeId: tx.employeeId,
            month: monthStr
          }
        },
        update: {
          treasuryTxs: {
            connect: { id: tx.id }
          }
        },
        create: {
          employeeId: tx.employeeId,
          month: monthStr,
          amount: 0,
          isPaid: false,
          treasuryTxs: {
            connect: { id: tx.id }
          }
        }
      });
      fixed++;
    }
  }
  console.log(`Fixed ${fixed} transactions.`);
}

fix().catch(console.error).finally(() => prisma.$disconnect());
