const fs = require('fs');

const file = 'src/app/facturacion/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace exact match with startsWith for both history logic sections
content = content.replace(
  "if (t.description === 'Abono Mensual') {",
  "if (t.description && t.description.startsWith('Abono Mensual')) {"
);

content = content.replace(
  "const tx = c.accountTransactions?.find(t => t.description === 'Abono Mensual' && t.date.startsWith(month));",
  "const tx = c.accountTransactions?.find(t => t.description && t.description.startsWith('Abono Mensual') && t.date.startsWith(month));"
);

fs.writeFileSync(file, content);
console.log('Fixed description matching in Facturacion UI');
