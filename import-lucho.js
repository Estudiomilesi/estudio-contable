const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const monthMap = {
  'ene': '01',
  'feb': '02',
  'mar': '03',
  'abr': '04',
  'may': '05',
  'jun': '06',
  'jul': '07',
  'ago': '08',
  'sept': '09',
  'oct': '10',
  'nov': '11',
  'dic': '12'
};

async function main() {
  const content = fs.readFileSync('C:/Users/FEDE/.gemini/antigravity/brain/51d09acc-940f-4134-b182-d6ad4acba13e/.system_generated/steps/2026/content.md', 'utf8');
  
  const lines = content.split('\n');
  const csvStart = lines.findIndex(l => l.startsWith('Aumento Come'));
  const csvLines = lines.slice(csvStart + 1).filter(l => l.trim() !== '');

  // Ensure Lucho exists
  const employee = await prisma.employee.upsert({
    where: { name: 'Lucho' },
    update: {},
    create: { name: 'Lucho' }
  });

  for (let i = 0; i < csvLines.length; i++) {
    const rowStr = csvLines[i];
    if (rowStr.trim() === '') continue;
    const row = [];
    let insideQuote = false;
    let currentVal = '';
    for (let char of rowStr) {
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(currentVal);
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    row.push(currentVal);

    const monthRaw = row[1]; // e.g. "ago- 24"
    if (!monthRaw) continue;

    const parts = monthRaw.split('-');
    if (parts.length !== 2) continue;

    const mName = parts[0].trim().toLowerCase();
    const yName = parts[1].trim();

    const mm = monthMap[mName];
    if (!mm) continue;
    const yy = '20' + yName;
    const month = `${yy}-${mm}`;

    const totalRaw = row[5]; // Total column
    if (!totalRaw) continue;

    // The amount is like "1.300.000,00". We need to remove dots and replace comma with dot
    const cleanStr = totalRaw.replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(cleanStr);

    if (!isNaN(amount) && amount > 0) {
      await prisma.salary.upsert({
        where: { employeeId_month: { employeeId: employee.id, month } },
        update: { amount, isPaid: true }, // We assume historical are paid, the app can be used from now on
        create: {
          employeeId: employee.id,
          month,
          amount,
          isPaid: true
        }
      });
      console.log(`Updated Lucho for ${month}: ${amount}`);
    }
  }

  console.log('Done importing Lucho salaries.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
