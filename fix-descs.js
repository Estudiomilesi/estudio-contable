const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.accountTransaction.updateMany({
    where: {
      description: {
        startsWith: 'Factura A Cod'
      }
    },
    data: {
      description: 'Abono Mensual - Septiembre 2026'
    }
  });
  console.log('Updated:', count);
}

main().finally(() => prisma.$disconnect());
