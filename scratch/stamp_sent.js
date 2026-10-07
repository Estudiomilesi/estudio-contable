const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clients = await prisma.client.findMany({
      where: { isActive: true },
      include: {
        accountTransactions: true
      }
    });

    let updated = 0;
    const today = new Date();
    
    for (const client of clients) {
      if (!client.email || client.email === 'falta@email.com') continue;

      let balance = 0;
      client.accountTransactions.forEach(tx => {
        if (tx.type === 'CHARGE') balance += tx.amount;
        else balance -= tx.amount;
      });

      if (balance > 100) {
        await prisma.client.update({
          where: { id: client.id },
          data: { lastDebtNoticeSent: today }
        });
        updated++;
      }
    }
    console.log('Updated', updated, 'clients');
}

main().catch(console.error).finally(() => prisma.$disconnect());
