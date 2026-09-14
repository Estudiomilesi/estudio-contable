const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const client = await prisma.client.findFirst({ where: { cuit: '30-63291155-2' } }); // try with dashes too
  const client2 = await prisma.client.findFirst({ where: { cuit: '30632911552' } });
  const client3 = await prisma.client.findFirst({ where: { name: { contains: 'MONDO', mode: 'insensitive' } } });
  
  console.log('Client with dashes:', client);
  console.log('Client without dashes:', client2);
  console.log('Client by name:', client3);
}
main().catch(console.error).finally(() => prisma.$disconnect());
