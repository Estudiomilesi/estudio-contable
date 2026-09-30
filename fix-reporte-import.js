const fs = require('fs');

const routeReporte = 'src/app/api/cuentas-corrientes/enviar-reporte/route.ts';
let contentReporte = fs.readFileSync(routeReporte, 'utf8');

if (!contentReporte.includes('import { sendEmail }')) {
  contentReporte = contentReporte.replace(
    "import { prisma } from '@/lib/prisma';",
    "import { prisma } from '@/lib/prisma';\nimport { sendEmail } from '@/lib/mailer';"
  );
}

fs.writeFileSync(routeReporte, contentReporte);
console.log('Fixed imports in enviar-reporte');

// Just to be absolutely safe, let's also check procesar/route.ts
const routeProcesar = 'src/app/api/facturacion/procesar/route.ts';
let contentProcesar = fs.readFileSync(routeProcesar, 'utf8');
if (!contentProcesar.includes('import { sendEmail }')) {
  contentProcesar = contentProcesar.replace(
    "import { prisma } from '@/lib/prisma';",
    "import { prisma } from '@/lib/prisma';\nimport { sendEmail } from '@/lib/mailer';"
  );
  fs.writeFileSync(routeProcesar, contentProcesar);
  console.log('Fixed imports in procesar');
}
