const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tTxs = await prisma.treasuryTransaction.findMany();
  let c = 0;
  for (const t of tTxs) {
    if (t.date.toISOString().endsWith('T00:00:00.000Z')) {
      await prisma.treasuryTransaction.update({
        where: { id: t.id },
        data: { date: new Date(t.date.toISOString().replace('T00:00:00.000Z', 'T12:00:00.000Z')) }
      });
      c++;
    }
  }
  const aTxs = await prisma.accountTransaction.findMany();
  for (const t of aTxs) {
    if (t.date.toISOString().endsWith('T00:00:00.000Z')) {
      await prisma.accountTransaction.update({
        where: { id: t.id },
        data: { date: new Date(t.date.toISOString().replace('T00:00:00.000Z', 'T12:00:00.000Z')) }
      });
      c++;
    }
  }
  console.log('Fixed', c, 'dates');
}

main().catch(console.error).finally(() => prisma.$disconnect());
