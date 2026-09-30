const fs = require('fs');

const routeHtml = 'src/app/api/comprobantes/enviar-html/route.ts';
let contentHtml = fs.readFileSync(routeHtml, 'utf8');

contentHtml = contentHtml.replace(/import nodemailer from 'nodemailer';\r?\n/, '');
contentHtml = contentHtml.replace(/const transporter = nodemailer\.createTransport\(\{[\s\S]*?\}\);\r?\n\r?\n/, '');

if (!contentHtml.includes('import { sendEmail }')) {
  contentHtml = contentHtml.replace("import { prisma } from '@/lib/prisma';", "import { prisma } from '@/lib/prisma';\nimport { sendEmail } from '@/lib/mailer';");
}

contentHtml = contentHtml.replace(
  /if \(\!process\.env\.SMTP_USER\) \{[\s\S]*?\} else \{[\s\S]*?await transporter\.sendMail\(\{[\s\S]*?\}\);\r?\n    \}/,
  `await sendEmail(correosDestino, \`\${titulo} - \${periodoStr} - \${firma}\`, htmlEmail, undefined, senderEmail);`
);

fs.writeFileSync(routeHtml, contentHtml);
console.log('Fixed enviar-html');

const routeAfip = 'src/app/api/comprobantes/[id]/adjuntar-afip/route.ts';
let contentAfip = fs.readFileSync(routeAfip, 'utf8');

contentAfip = contentAfip.replace(/import nodemailer from 'nodemailer';\r?\n/, '');
contentAfip = contentAfip.replace(/const transporter = nodemailer\.createTransport\(\{[\s\S]*?\}\);\r?\n\r?\n/, '');

if (!contentAfip.includes('import { sendEmail }')) {
  contentAfip = contentAfip.replace("import { prisma } from '@/lib/prisma';", "import { prisma } from '@/lib/prisma';\nimport { sendEmail } from '@/lib/mailer';");
}

contentAfip = contentAfip.replace(
  /if \(\!process\.env\.SMTP_USER\) \{[\s\S]*?\} else \{[\s\S]*?await transporter\.sendMail\(\{[\s\S]*?\}\);\r?\n    \}/,
  `await sendEmail(correosDestino, subject, htmlEmail, [\n        {\n          filename: \`Factura_\${pdfData.receiptNumber}.pdf\`,\n          content: buffer,\n          contentType: 'application/pdf'\n        }\n      ], senderEmail);`
);

fs.writeFileSync(routeAfip, contentAfip);
console.log('Fixed adjuntar-afip');
