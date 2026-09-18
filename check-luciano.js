const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const salaries = await prisma.salary.findMany({
    where: { 
      employee: { name: { contains: 'Lucho' } } // Actually, let's search 'Luciano' or 'Lucho'
    },
    include: { employee: true, treasuryTxs: true },
    orderBy: { month: 'desc' },
    take: 5
  });
  
  const luciano = await prisma.employee.findMany({ where: { name: { contains: 'Luc' } }});
  
  const allSal = await prisma.salary.findMany({
    where: { amount: { gt: 2000000 } },
    include: { employee: true, treasuryTxs: true }
  });
  
  console.dir({ luciano, salaries, allSal }, { depth: null });
}

check().catch(console.error).finally(() => prisma.$disconnect());
