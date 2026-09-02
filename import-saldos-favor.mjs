import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clientsData = [
    { name: 'GUSIC SA', amount: 5298402.50 },
    { name: 'GUSIC JOSE SIMON', amount: 4948402.50 },
    { name: 'CICCONI JORGE', amount: 234060.00 },
    { name: 'IPLOV', amount: 99992.00 },
    { name: 'FONTAGRO', amount: 11988.00 }
  ];

  for (const item of clientsData) {
    const client = await prisma.client.findFirst({
      where: {
        name: {
          contains: item.name,
          mode: 'insensitive'
        }
      }
    });

    if (client) {
      await prisma.accountTransaction.create({
        data: {
          clientId: client.id,
          date: new Date('2026-09-02T12:00:00Z'),
          type: 'PAYMENT',
          amount: item.amount,
          description: 'Saldo a favor inicial'
        }
      });
      console.log(`✅ Saldo a favor importado para: ${client.name} ($${item.amount})`);
    } else {
      console.log(`❌ No encontrado: ${item.name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
