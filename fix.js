const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.accountTransaction.update({
    where: { id: 'cmtknb43x00lfu6uggf987z3h' },
    data: { clientId: 'cmtkezqc7000bu6cc8wy0ilt8' }
  });
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
