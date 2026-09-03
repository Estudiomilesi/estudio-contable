const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const txs = await prisma.accountTransaction.findMany({
    where: {
      type: 'PAYMENT',
      date: { gte: firstDayOfMonth },
      NOT: [
        { description: { startsWith: 'NC:' } },
        { description: { contains: 'saldo a favor' } }
      ]
    },
    include: { client: { select: { name: true } } }
  });
  
  console.log('Count:', txs.length);
  const total = txs.reduce((sum, t) => sum + t.amount, 0);
  console.log('Total:', total);
  txs.forEach(t => console.log(t.amount, t.description, t.client?.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
