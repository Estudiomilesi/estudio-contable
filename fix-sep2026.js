const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.salary.updateMany({
    where: { month: '2026-09' },
    data: { isPaid: false, treasuryTxId: null, paidAt: null }
  });
  console.log('Unpaid 2026-09 salaries:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
