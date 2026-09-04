const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employee = await prisma.employee.findUnique({ where: { name: 'Gessi' } });
  if (!employee) return console.error('Gessi not found');
  
  await prisma.salary.upsert({
    where: { employeeId_month: { employeeId: employee.id, month: '2026-08' } },
    update: { amount: 492000, isPaid: true },
    create: { employeeId: employee.id, month: '2026-08', amount: 492000, isPaid: true }
  });
  console.log('Gessi updated');
}

main().catch(console.error).finally(() => prisma.$disconnect());
