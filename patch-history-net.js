const fs = require('fs');
let content = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

// Update the history loop in totales to sum tx.netAmount instead of tx.amount
content = content.replace(
  /history\[month\]\.General \+= tx\.amount;/g,
  "const amt = (tx.netAmount === 0 && tx.amount !== 0) ? tx.amount : tx.netAmount;\n          history[month].General += amt;"
);
content = content.replace(
  /if \(c\.professionalLabel === 'F'\) history\[month\]\.F \+= tx\.amount;/g,
  "if (c.professionalLabel === 'F') history[month].F += amt;"
);
content = content.replace(
  /if \(c\.professionalLabel === 'FJ'\) history\[month\]\.FJ \+= tx\.amount;/g,
  "if (c.professionalLabel === 'FJ') history[month].FJ += amt;"
);
content = content.replace(
  /if \(c\.professionalLabel === 'JF'\) history\[month\]\.JF \+= tx\.amount;/g,
  "if (c.professionalLabel === 'JF') history[month].JF += amt;"
);

// Update the render loop for historical columns to show tx.netAmount instead of tx.amount
content = content.replace(
  /tx \? tx\.amount\.toLocaleString/g,
  "tx ? ((tx.netAmount === 0 && tx.amount !== 0) ? tx.amount : tx.netAmount).toLocaleString"
);

fs.writeFileSync('src/app/facturacion/page.tsx', content);
console.log('Fixed historical amounts to use netAmount');
