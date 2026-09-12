const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.treasuryTransaction.findMany({
    where: { 
      category: 'Honorarios', 
      date: { in: [new Date('2026-09-01T12:00:00Z'), new Date('2026-09-02T12:00:00Z')] } 
    }
  });

  console.log(`Processing ${txs.length} transactions...`);

  for (const t of txs) {
    if (!t.clientId) {
      console.log(`Skipping tx ${t.id} without clientId`);
      continue;
    }

    let net = t.amount;
    let iva = 0;

    if (t.description === '181.500 Honorarios 38.115 IVA') {
      net = 181500;
      iva = 38115;
    } else if (t.description === '532.500 honorarios, 111.825 IVA') {
      net = 532500;
      iva = 111825;
    }

    // Check if we already created it to avoid duplicates
    const existing = await prisma.accountTransaction.findFirst({
      where: {
        clientId: t.clientId,
        date: t.date,
        type: 'CHARGE',
        description: 'Saldo inicial (Migración)'
      }
    });

    if (existing) {
      console.log(`Already processed clientId ${t.clientId} for amount ${t.amount}`);
      continue;
    }

    // Create CHARGE
    const charge = await prisma.accountTransaction.create({
      data: {
        clientId: t.clientId,
        date: t.date,
        type: 'CHARGE',
        billingProfile: 'NO_FISCAL',
        netAmount: net,
        ivaAmount: iva,
        amount: t.amount,
        description: 'Saldo inicial (Migración)'
      }
    });

    // Create PAYMENT
    const payment = await prisma.accountTransaction.create({
      data: {
        clientId: t.clientId,
        date: t.date,
        type: 'PAYMENT',
        billingProfile: 'NO_FISCAL',
        netAmount: net,
        ivaAmount: iva,
        amount: t.amount,
        description: 'Cobro (Migración)'
      }
    });

    // Create Application
    await prisma.paymentApplication.create({
      data: {
        chargeId: charge.id,
        paymentId: payment.id,
        amount: t.amount
      }
    });

    console.log(`Inserted AccountTransactions for clientId ${t.clientId} amount ${t.amount}`);
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
