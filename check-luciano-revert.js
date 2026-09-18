const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const lucho8 = await prisma.salary.findFirst({
    where: { employee: { name: 'Lucho' }, month: '2026-08' },
    include: { treasuryTxs: true }
  });
  const lucho9 = await prisma.salary.findFirst({
    where: { employee: { name: 'Lucho' }, month: '2026-09' },
    include: { treasuryTxs: true }
  });

  console.dir({ 'Agosto': lucho8, 'Septiembre': lucho9 }, { depth: null });
}

check().catch(console.error).finally(() => prisma.$disconnect());
