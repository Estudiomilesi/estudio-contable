const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const txs = await prisma.treasuryTransaction.findMany({
    where: {
      type: 'EXPENSE',
      category: 'Sueldos',
      employeeId: { not: null }
    },
    include: { salaries: true }
  });

  for (const tx of txs) {
    // Desconectar de todas las planillas actuales para relinkear correctamente
    for (const sal of tx.salaries) {
      await prisma.salary.update({
        where: { id: sal.id },
        data: { treasuryTxs: { disconnect: { id: tx.id } } }
      });
    }

    const txAmount = Math.abs(tx.amount);
    
    // 1. Intentar hacer match por importe exacto (muy común en sueldos)
    const exactMatch = await prisma.salary.findFirst({
      where: {
        employeeId: tx.employeeId,
        amount: { gte: txAmount - 1, lte: txAmount + 1 }
      }
    });

    if (exactMatch) {
      console.log(`Matched Tx ${tx.id} (${txAmount}) exactly to Salary ${exactMatch.month}`);
      await prisma.salary.update({
        where: { id: exactMatch.id },
        data: { treasuryTxs: { connect: { id: tx.id } } }
      });
      continue;
    }

    // 2. Si no hay match exacto, usamos heurística de fechas
    // Si se pagó entre el 1 y el 10, suele ser del mes anterior
    const txDate = tx.date;
    let targetMonthDate = new Date(txDate);
    if (txDate.getDate() <= 15) {
      targetMonthDate.setMonth(targetMonthDate.getMonth() - 1);
    }
    
    const yyyy = targetMonthDate.getFullYear();
    const mm = String(targetMonthDate.getMonth() + 1).padStart(2, '0');
    const monthStr = `${yyyy}-${mm}`;

    console.log(`Matched Tx ${tx.id} (${txAmount}) heuristically to Salary ${monthStr}`);
    
    await prisma.salary.upsert({
      where: {
        employeeId_month: {
          employeeId: tx.employeeId,
          month: monthStr
        }
      },
      update: {
        treasuryTxs: { connect: { id: tx.id } }
      },
      create: {
        employeeId: tx.employeeId,
        month: monthStr,
        amount: 0,
        isPaid: false,
        treasuryTxs: { connect: { id: tx.id } }
      }
    });
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
