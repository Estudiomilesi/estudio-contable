const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.accountTransaction.updateMany({
    where: {
      receiptNumber: {
        in: Array.from({ length: 47 }, (_, i) => 'ABON-' + String(99 + i).padStart(7, '0'))
      }
    },
    data: { isEmailed: false }
  });
  console.log('Updated:', count);
}

main().finally(() => prisma.$disconnect());
