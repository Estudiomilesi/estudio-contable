const fs = require('fs');

const filesToRefactor = [
  'src/app/api/comprobantes/enviar/route.ts',
  'src/app/api/comprobantes/enviar-html/route.ts',
  'src/app/api/comprobantes/[id]/adjuntar-afip/route.ts'
];

for (const file of filesToRefactor) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove nodemailer import and transporter creation
    content = content.replace(/import nodemailer from 'nodemailer';\r?\n\r?\nconst transporter = nodemailer\.createTransport\(\{[\s\S]*?\}\);\r?\n/, '');

    // 2. Add import for sendEmail
    if (!content.includes('import { sendEmail } from')) {
      content = content.replace(
        "import { prisma } from '@/lib/prisma';",
        "import { prisma } from '@/lib/prisma';\nimport { sendEmail } from '@/lib/mailer';"
      );
    }

    // 3. Find await transporter.sendMail({ ... }) and replace with await sendEmail(to, subject, html, attachments, senderEmail)
    // This is tricky using regex for full blocks, so we do it file by file if needed, but let's use a dynamic replace.
    // Let's just use string replacement on the exact sendMail blocks.
    if (file.includes('enviar/route.ts')) {
      content = content.replace(
        /await transporter\.sendMail\(\{[\s\S]*?to: correosDestino,\s*subject,\s*html,\s*attachments: \[\s*\{\s*filename[\s\S]*?\}\s*\]\s*\}\);/,
        `await sendEmail(correosDestino, subject, html, [\n        {\n          filename: \`Comprobante_\${tx.receiptNumber || 'Honorarios'}.pdf\`,\n          content: buffer,\n          contentType: 'application/pdf'\n        }\n      ], senderEmail);`
      );
    }
    
    if (file.includes('enviar-html/route.ts')) {
       content = content.replace(
         /await transporter\.sendMail\(\{[\s\S]*?html,\s*\}\);/,
         `await sendEmail(correosDestino, subject, html, undefined, senderEmail);`
       );
    }

    if (file.includes('adjuntar-afip')) {
       content = content.replace(
         /await transporter\.sendMail\(\{[\s\S]*?attachments[\s\S]*?\}\);/,
         `await sendEmail(correosDestino, subject, htmlEmail, attachments, senderEmail);`
       );
    }

    fs.writeFileSync(file, content);
  }
}
console.log('Refactored emails');
