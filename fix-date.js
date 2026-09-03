const fs = require('fs');

const files = [
  'src/app/api/comprobantes/route.ts',
  'src/app/api/cuentas-corrientes/cobro-rapido/route.ts',
  'src/app/api/facturacion/procesar/route.ts',
  'src/app/api/tesoreria/route.ts'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  
  if (!content.includes('parseToUtcNoon')) {
    content = content.replace(/import \{ prisma \} from '@\/lib\/prisma';/, "import { prisma } from '@/lib/prisma';\nimport { parseToUtcNoon } from '@/lib/dateUtils';");
  }

  content = content.replace(/[ \t]*const parseDate = \([^\)]+\) => \{[\s\S]*?return new Date\([^}]+\};\s*/, '');
  content = content.replace(/parseDate\(/g, 'parseToUtcNoon(');

  fs.writeFileSync(f, content);
}
console.log('Replaced parseDate in API routes');
