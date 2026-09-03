const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const charges = await prisma.accountTransaction.findMany({
    where: {
      type: 'CHARGE',
      description: {
        contains: '00003-'
      }
    },
    include: { client: true }
  });
  
  console.log(`Found ${charges.length} charges with 00003-`);
  
  let updatedCount = 0;
  for (const c of charges) {
    if (c.billingProfile !== 'FEDE_RI' || c.ivaAmount === 0) {
      const net = c.amount / 1.21;
      const iva = c.amount - net;
      
      await prisma.accountTransaction.update({
        where: { id: c.id },
        data: {
          billingProfile: 'FEDE_RI',
          netAmount: net,
          ivaAmount: iva
        }
      });
      console.log(`Updated charge for ${c.client.name}: ${c.description} -> Neto: ${net.toFixed(2)}, IVA: ${iva.toFixed(2)}`);
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} charges.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
