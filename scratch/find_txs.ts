import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.treasuryTransaction.findMany({
    where: { date: { lt: new Date('2026-09-03T00:00:00Z') } }
  });
  console.log(txs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
