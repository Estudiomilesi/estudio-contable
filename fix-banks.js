const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.treasuryTransaction.findMany({
    where: { 
      account: { in: ['BANCOS FEDE', 'BANCOS JUANMA'] },
      type: 'INCOME'
    }
  });

  for (const tTx of txs) {
    let participacionPaga = 0;

    // Check if it's an Honorarios collection
    if (tTx.category === 'Honorarios') {
      // Try to find the linked AccountTransaction (PAYMENT)
      // They are usually created at the exact same moment or have incomingTxId in some flows
      const accountTxs = await prisma.accountTransaction.findMany({
        where: {
          type: 'PAYMENT',
          amount: tTx.amount,
          clientId: tTx.clientId
        },
        include: {
          paymentsApplied: {
            include: { charge: true }
          }
        }
      });
      
      // Match by finding the closest date (within 1 minute)
      const matched = accountTxs.find(aTx => Math.abs(aTx.date.getTime() - tTx.date.getTime()) < 60000);
      
      if (matched) {
        for (const app of matched.paymentsApplied) {
          if (app.charge.collaboratorAmount && app.charge.collaboratorAmount > 0) {
            const proportion = app.amount / app.charge.amount;
            participacionPaga += app.charge.collaboratorAmount * proportion;
          }
        }
      }
    }

    const retiroSocio = tTx.account === 'BANCOS FEDE' ? 'Retiro Fede' : 'Retiro Juanma';
    const retiroAmount = Math.max(0, tTx.amount - participacionPaga);

    if (retiroAmount > 0) {
      // Verificamos si ya existe un retiro automático o manual parecido para evitar duplicar
      const existe = await prisma.treasuryTransaction.findFirst({
        where: {
          account: tTx.account,
          type: 'EXPENSE',
          category: retiroSocio,
          amount: -retiroAmount,
          date: tTx.date
        }
      });

      if (!existe) {
        console.log(`Creating Retiro of $${retiroAmount} for ${tTx.account} on ${tTx.date.toISOString()} (Participacion: $${participacionPaga})`);
        await prisma.treasuryTransaction.create({
          data: {
            date: tTx.date,
            amount: -retiroAmount,
            type: 'EXPENSE',
            account: tTx.account,
            category: retiroSocio,
            description: `Retiro automático s/ cobro (Histórico)`,
            clientId: tTx.clientId
          }
        });
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
