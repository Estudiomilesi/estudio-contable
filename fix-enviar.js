const fs = require('fs');

const routeEnviar = 'src/app/api/comprobantes/enviar/route.ts';
let contentEnviar = fs.readFileSync(routeEnviar, 'utf8');

contentEnviar = contentEnviar.replace(/import nodemailer from 'nodemailer';\r?\n/, '');
contentEnviar = contentEnviar.replace(/const transporter = nodemailer\.createTransport\(\{[\s\S]*?\}\);\r?\n\r?\n/, '');

if (!contentEnviar.includes('import { sendEmail }')) {
  contentEnviar = contentEnviar.replace("import { prisma } from '@/lib/prisma';", "import { prisma } from '@/lib/prisma';\nimport { sendEmail } from '@/lib/mailer';");
}

contentEnviar = contentEnviar.replace(
  /await transporter\.sendMail\(\{[\s\S]*?\}\);/,
  `await sendEmail(correosDestino, subject, html, [\n      {\n        filename: \`Comprobante_\${tx.receiptNumber || 'Honorarios'}.pdf\`,\n        content: buffer,\n        contentType: 'application/pdf'\n      }\n    ], senderEmail);`
);

fs.writeFileSync(routeEnviar, contentEnviar);
console.log('Fixed enviar/route.ts');

const routeProcesar = 'src/app/api/facturacion/procesar/route.ts';
let contentProcesar = fs.readFileSync(routeProcesar, 'utf8');
contentProcesar = contentProcesar.replace(/import nodemailer from 'nodemailer';\r?\n/, '');
contentProcesar = contentProcesar.replace(/const transporter = nodemailer\.createTransport\(\{[\s\S]*?\}\);\r?\n\r?\n/, '');
fs.writeFileSync(routeProcesar, contentProcesar);

const routeReporte = 'src/app/api/cuentas-corrientes/enviar-reporte/route.ts';
let contentReporte = fs.readFileSync(routeReporte, 'utf8');
contentReporte = contentReporte.replace(/import nodemailer from 'nodemailer';\r?\n/, '');
contentReporte = contentReporte.replace(/const transporter = nodemailer\.createTransport\(\{[\s\S]*?\}\);\r?\n\r?\n/, '');
fs.writeFileSync(routeReporte, contentReporte);

console.log('Fixed other routes');
