const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const charges = await prisma.accountTransaction.findMany({
    where: { 
      type: 'CHARGE',
      description: {
        contains: '00003-'
      },
      client: {
        defaultBillingProfile: 'FEDE_RI'
      }
    }
  });

  let updated = 0;
  for (const charge of charges) {
    if (charge.ivaAmount === 0 && charge.amount > 0) {
      const net = charge.amount / 1.21;
      const iva = charge.amount - net;
      await prisma.accountTransaction.update({
        where: { id: charge.id },
        data: {
          billingProfile: 'FEDE_RI',
          netAmount: net,
          ivaAmount: iva
        }
      });
      updated++;
    }
  }

  console.log({ found: charges.length, updated });
}

main().catch(console.error).finally(() => prisma.$disconnect());
