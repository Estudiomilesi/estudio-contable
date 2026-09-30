const fs = require('fs');

const file = 'src/app/api/facturacion/procesar/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const debeEnviarEmailInmediato = profile === 'NO_FISCAL';",
  "const debeEnviarEmailInmediato = profile === 'NO_FISCAL' || totalAmount === 0;"
);

fs.writeFileSync(file, content);
console.log('Fixed debeEnviarEmailInmediato in procesar/route.ts');
