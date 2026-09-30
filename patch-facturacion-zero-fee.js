const fs = require('fs');

const file = 'src/app/api/facturacion/procesar/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('currentFee: { gt: 0 }', 'currentFee: { gte: 0 }');

fs.writeFileSync(file, content);
console.log('Fixed currentFee filter in procesar/route.ts');
