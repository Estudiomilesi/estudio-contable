const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.accountTransaction.findMany({
    where: {
      type: 'PAYMENT'
    }
  });
  console.log('All payments count:', txs.length);
  
  const initial = txs.filter(t => t.description && t.description.toLowerCase().includes('saldo'));
  console.log('Saldo inicial payments:', initial.map(t => ({ desc: t.description, amount: t.amount })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
