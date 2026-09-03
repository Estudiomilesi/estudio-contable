const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tTxs = await prisma.treasuryTransaction.findMany();
  for (const t of tTxs) {
    const iso = t.date.toISOString();
    const desired = iso.split('T')[0] + 'T12:00:00.000Z';
    if (iso !== desired) {
      await prisma.treasuryTransaction.update({
        where: { id: t.id },
        data: { date: new Date(desired) }
      });
      console.log(`Updated T-TX ${t.id} from ${iso} to ${desired}`);
    }
  }

  const aTxs = await prisma.accountTransaction.findMany();
  for (const a of aTxs) {
    const iso = a.date.toISOString();
    const desired = iso.split('T')[0] + 'T12:00:00.000Z';
    if (iso !== desired) {
      await prisma.accountTransaction.update({
        where: { id: a.id },
        data: { date: new Date(desired) }
      });
      console.log(`Updated A-TX ${a.id} from ${iso} to ${desired}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
