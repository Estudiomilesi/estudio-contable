const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const content = fs.readFileSync('C:/Users/FEDE/.gemini/antigravity/brain/51d09acc-940f-4134-b182-d6ad4acba13e/.system_generated/steps/1979/content.md', 'utf8');
  
  const lines = content.split('\n');
  const csvStart = lines.findIndex(l => l.startsWith('Mes,Luichi'));
  const csvLines = lines.slice(csvStart).filter(l => l.trim() !== '');
  
  const headers = csvLines[0].split(',');
  const employeeNames = headers.slice(1, -1);
  
  const employees = {};
  for (const name of employeeNames) {
    if (!name || name === 'Total') continue;
    employees[name] = await prisma.employee.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    console.log('Created/found employee: ' + name);
  }
  
  for (let i = 1; i < csvLines.length; i++) {
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
    
    const month = row[0]; 
    if (!month || month.length !== 7) continue;
    
    for (let j = 1; j < headers.length - 1; j++) {
      const name = headers[j];
      if (!name || name === 'Total') continue;
      const amountStr = row[j];
      if (amountStr && amountStr.trim() !== '') {
        const cleanStr = amountStr.replace(/[\$\s,]/g, '');
        const amount = parseFloat(cleanStr);
        if (!isNaN(amount) && amount > 0) {
          await prisma.salary.upsert({
            where: { employeeId_month: { employeeId: employees[name].id, month } },
            update: { amount, isPaid: true }, // We assume historical are paid
            create: {
              employeeId: employees[name].id,
              month,
              amount,
              isPaid: true
            }
          });
        }
      }
    }
  }
  console.log('Done importing salaries.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
