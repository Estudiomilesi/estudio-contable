const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const chargeId = 'cmtknb43x00lfu6uggf987z3h';
  const paymentId = 'cmtljz3ev0009jo046zu8rioz';
  
  const amount = 1005447.08;
  const net = amount / 1.21;
  const iva = amount - net;
  
  // Fix charge
  await prisma.accountTransaction.update({
    where: { id: chargeId },
    data: {
      netAmount: net,
      ivaAmount: iva,
      billingProfile: 'FEDE_RI'
    }
  });
  
  // Fix payment
  await prisma.accountTransaction.update({
    where: { id: paymentId },
    data: {
      netAmount: net,
      ivaAmount: iva,
      billingProfile: 'FEDE_RI'
    }
  });
  
  console.log('Fixed IVA for charge and payment');
}

main().catch(console.error).finally(() => prisma.$disconnect());
