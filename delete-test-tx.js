const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tx = await prisma.accountTransaction.findFirst({
    where: { receiptNumber: 'FACT-00000029' }
  });

  if (tx) {
    await prisma.accountTransactionItem.deleteMany({
      where: { transactionId: tx.id }
    });
    
    await prisma.treasuryTransaction.deleteMany({
        where: { accountTransactionId: tx.id }
    });

    await prisma.accountTransaction.delete({
      where: { id: tx.id }
    });
    
    console.log('Borrado exitoso:', tx.id);
  } else {
    console.log('No encontrado FACT-00000029');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
