import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const saldos = [
    { account: 'CAJA', amount: 538000.00 },
    { account: 'BANCOS FEDE', amount: 1696440.00 },
    { account: 'BANCOS JUANMA', amount: 1133198.00 },
    { account: 'CAJA IVA', amount: 2684480.59 }
  ];

  for (const item of saldos) {
    await prisma.treasuryTransaction.create({
      data: {
        date: new Date('2026-09-02T12:00:00Z'),
        account: item.account,
        type: 'INCOME',
        category: 'Saldo Inicial',
        description: 'Saldo inicial importado',
        amount: item.amount
      }
    });
    console.log(`✅ Saldo inicial importado para: ${item.account} ($${item.amount})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
