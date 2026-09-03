const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.accountTransaction.findMany();
  let updated = 0;
  for (const tx of txs) {
    if (tx.netAmount === 0 && tx.amount !== 0) {
      await prisma.accountTransaction.update({
        where: { id: tx.id },
        data: { netAmount: tx.amount, ivaAmount: 0 }
      });
      updated++;
    }
  }
  console.log('Updated', updated, 'transactions');
}

main().catch(console.error).finally(() => prisma.$disconnect());
