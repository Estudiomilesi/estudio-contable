const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function revert() {
  const txs = await prisma.treasuryTransaction.findMany({
    where: {
      type: 'EXPENSE',
      category: 'Sueldos',
      employeeId: { not: null }
    },
    include: { salaries: true }
  });

  for (const tx of txs) {
    const isToday = tx.date.toISOString().startsWith('2026-09-18');
    
    // Si no es un pago de hoy, lo desconectamos de todo para "dejar como estaba"
    if (!isToday) {
      for (const sal of tx.salaries) {
        await prisma.salary.update({
          where: { id: sal.id },
          data: { treasuryTxs: { disconnect: { id: tx.id } } }
        });
      }
    } else {
      // Si es un pago de hoy, lo conectamos SÓLO a septiembre
      for (const sal of tx.salaries) {
        if (sal.month !== '2026-09') {
          await prisma.salary.update({
            where: { id: sal.id },
            data: { treasuryTxs: { disconnect: { id: tx.id } } }
          });
        }
      }
      // Conectar a sept si no estaba
      await prisma.salary.upsert({
        where: { employeeId_month: { employeeId: tx.employeeId, month: '2026-09' } },
        update: { treasuryTxs: { connect: { id: tx.id } } },
        create: {
          employeeId: tx.employeeId,
          month: '2026-09',
          amount: 0,
          isPaid: false,
          treasuryTxs: { connect: { id: tx.id } }
        }
      });
    }
  }
}

revert().catch(console.error).finally(() => prisma.$disconnect());
