const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const monthMap = {
  'enero': '01',
  'febrero': '02',
  'marzo': '03',
  'abril': '04',
  'mayo': '05',
  'junio': '06',
  'julio': '07',
  'agosto': '08',
  'septiembre': '09',
  'setiembre': '09',
  'octubre': '10',
  'noviembre': '11',
  'diciembre': '12'
};

async function main() {
  const content = fs.readFileSync('C:/Users/FEDE/.gemini/antigravity/brain/51d09acc-940f-4134-b182-d6ad4acba13e/.system_generated/steps/2038/content.md', 'utf8');
  
  const lines = content.split('\n');
  const csvStart = lines.findIndex(l => l.startsWith('Setiembre 2024'));
  const csvLines = lines.slice(csvStart).filter(l => l.trim() !== '');

  const employee = await prisma.employee.upsert({
    where: { name: 'Noe' },
    update: {},
    create: { name: 'Noe' }
  });

  let currentYear = 2024;

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

    const monthRaw = row[0]; // e.g. "Setiembre 2024", "Octubre", "enero 2025"
    if (!monthRaw) continue;

    const parts = monthRaw.trim().split(' ');
    const mName = parts[0].toLowerCase();
    const mm = monthMap[mName];
    if (!mm) continue;

    if (parts.length > 1) {
      currentYear = parseInt(parts[1], 10);
    } else if (mName === 'enero') {
      currentYear++;
    }

    const month = `${currentYear}-${mm}`;

    const pagoRaw = row[6]; // Pago column
    let amount = 0;

    if (pagoRaw) {
      const cleanStr = pagoRaw.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanStr);
      if (!isNaN(parsed)) amount += parsed;
    }

    const extrasRaw = row[4]; // Extras column
    if (extrasRaw) {
      const cleanStr = extrasRaw.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanStr);
      if (!isNaN(parsed)) amount += parsed;
    }

    const aguinaldoRaw = row[8]; // Aguinaldo column
    if (aguinaldoRaw && row[9] && row[9].trim().toLowerCase() === 'aguinaldo') {
      const cleanStr = aguinaldoRaw.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanStr);
      if (!isNaN(parsed)) amount += parsed;
    } else if (aguinaldoRaw && !row[9]) {
        // sometimes column 9 is missing but 8 has aguinaldo?
        // Let's check if the string contains Aguinaldo, or just parse if it's a number and row[9] is aguinaldo
        const cleanStr = aguinaldoRaw.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleanStr);
        if (!isNaN(parsed)) amount += parsed;
    }

    if (amount > 0) {
      await prisma.salary.upsert({
        where: { employeeId_month: { employeeId: employee.id, month } },
        update: { amount, isPaid: true }, // assume historical paid
        create: {
          employeeId: employee.id,
          month,
          amount,
          isPaid: true
        }
      });
      console.log(`Updated Noe for ${month}: ${amount}`);
    }
  }

  console.log('Done importing Noe salaries.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
