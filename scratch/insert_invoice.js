const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  try {
    const pdfPath = 'C:\\Users\\FEDE\\.gemini\\antigravity\\brain\\51d09acc-940f-4134-b182-d6ad4acba13e\\.user_uploaded\\media_1789066201390.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = 'data:application/pdf;base64,' + pdfBuffer.toString('base64');
    
    // Create Account Transaction
    const tx = await prisma.accountTransaction.create({
      data: {
        clientId: 'cmtkf01qs0025u6cc3s162150', // INTEGRAL CLEAN SRL
        date: new Date('2026-09-10T15:00:00Z'),
        dueDate: new Date('2026-09-10T15:00:00Z'),
        type: 'CHARGE',
        billingProfile: 'FEDE_RI',
        netAmount: 482000,
        ivaAmount: 101220,
        amount: 583220,
        receiptNumber: '00003-00000185',
        description: 'Honorarios Mensuales JF',
        receiptFileBase64: pdfBase64,
        isEmailed: false,
        items: {
          create: [
            {
              concept: '[HJF] Honorarios Mensuales JF',
              amount: 482000
            }
          ]
        }
      }
    });
    
    console.log('Transaction created successfully:', tx.id);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
