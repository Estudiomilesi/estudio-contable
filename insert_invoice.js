const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transaction = await prisma.accountTransaction.create({
    data: {
      clientId: 'cmtkf0csh003yu6ccgkoefdou',
      date: new Date('2026-09-11T00:00:00.000Z'),
      type: 'CHARGE',
      billingProfile: 'FEDE_RI',
      netAmount: 548350,
      ivaAmount: 115153.50,
      amount: 663503.50,
      description: 'Factura A 00003-00000186',
      receiptNumber: '00003-00000186',
      cae: '86372603967601',
      caeDueDate: new Date('2026-09-21T00:00:00.000Z'),
      afipTipoCmp: 1,
      items: {
        create: [
          {
            concept: '[HJF] Honorarios Mensuales JF Septiembre 2026',
            amount: 548350
          }
        ]
      }
    },
  });
  console.log('Successfully inserted transaction:', transaction);
}

main().catch(console.error).finally(() => prisma.$disconnect());
