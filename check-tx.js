const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const txs = await prisma.treasuryTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { client: true }
  });
  console.log(txs.map(t => [t.date.toISOString(), t.createdAt.toISOString(), t.client?.name || 'NoClient', t.amount, t.description].join(' | ')).join('\n'));
}
main().catch(console.error).finally(() => prisma.$disconnect());
