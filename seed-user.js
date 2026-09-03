const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'federico@estudiomilesi.com';
  const password = 'Admin2026!'; // Default password

  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.log('User already exists');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      role: 'ADMIN'
    }
  });

  console.log(`User created: ${email} with password: ${password}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
