const fs = require('fs');
let content = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

content = content.replace(
  "const amt = (tx.netAmount === 0 && tx.amount !== 0) ? tx.amount : tx.netAmount;",
  "const amt = (tx.netAmount === 0 && tx.amount !== 0) ? tx.amount : (tx.netAmount || 0);"
);

content = content.replace(
  "((tx.netAmount === 0 && tx.amount !== 0) ? tx.amount : tx.netAmount).toLocaleString",
  "((tx.netAmount === 0 && tx.amount !== 0) ? tx.amount : (tx.netAmount || 0)).toLocaleString"
);

fs.writeFileSync('src/app/facturacion/page.tsx', content);
console.log('Fixed typescript undefined amt issues');
