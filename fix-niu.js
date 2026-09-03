const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const client = await prisma.client.findFirst({ where: { name: { contains: 'NIU' } } });
  if (!client) return console.log('Client not found');

  const tTxs = await prisma.treasuryTransaction.findMany({
    where: { clientId: client.id, account: 'BANCOS FEDE', date: { gte: new Date('2026-09-01') } }
  });

  console.log('Found treasury txs:', tTxs.length);

  for (const t of tTxs) {
    if (t.type === 'INCOME') {
      await prisma.treasuryTransaction.update({
        where: { id: t.id },
        data: { account: 'BANCOS JUANMA', description: t.description.replace('BANCOS FEDE', 'BANCOS JUANMA') }
      });
    } else if (t.type === 'EXPENSE' && t.category === 'Retiro Fede') {
      await prisma.treasuryTransaction.update({
        where: { id: t.id },
        data: { account: 'BANCOS JUANMA', category: 'Retiro Juanma' }
      });
    }
  }

  const aTxs = await prisma.accountTransaction.findMany({
    where: { clientId: client.id, type: 'PAYMENT', date: { gte: new Date('2026-09-01') } }
  });

  console.log('Found account txs:', aTxs.length);

  for (const a of aTxs) {
    if (a.description.includes('BANCOS FEDE')) {
      await prisma.accountTransaction.update({
        where: { id: a.id },
        data: { description: a.description.replace('BANCOS FEDE', 'BANCOS JUANMA') }
      });
    }
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
