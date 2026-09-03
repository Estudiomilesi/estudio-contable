const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deleted1 = await prisma.treasuryTransaction.deleteMany({
    where: {
      account: 'BANCOS FEDE',
      type: 'EXPENSE',
      category: 'Retiro Fede',
      amount: -1696440,
      description: 'Retiro automático s/ cobro (Histórico)'
    }
  });

  const deleted2 = await prisma.treasuryTransaction.deleteMany({
    where: {
      account: 'BANCOS JUANMA',
      type: 'EXPENSE',
      category: 'Retiro Juanma',
      amount: -1133198,
      description: 'Retiro automático s/ cobro (Histórico)'
    }
  });

  console.log('Deleted', deleted1.count, deleted2.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
