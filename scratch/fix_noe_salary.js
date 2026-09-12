const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const noe = await prisma.employee.findFirst({ where: { name: 'Noe' }});
    if (!noe) throw new Error("Noe not found");

    const tx = await prisma.treasuryTransaction.findFirst({
      where: { 
        amount: { in: [-1410000, 1410000] },
        date: { gte: new Date('2026-09-12T00:00:00Z') }
      }
    });
    if (!tx) throw new Error("Transaction not found");

    // Update treasury transaction to assign to Noe
    await prisma.treasuryTransaction.update({
      where: { id: tx.id },
      data: { employeeId: noe.id }
    });

    // Create the salary and link it
    const salary = await prisma.salary.create({
      data: {
        employeeId: noe.id,
        month: '2026-09',
        amount: 1410000,
        isPaid: true,
        paidAt: tx.date,
        treasuryTxs: {
          connect: { id: tx.id }
        }
      }
    });

    console.log("Success! Updated TX:", tx.id, "Created Salary:", salary.id);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
