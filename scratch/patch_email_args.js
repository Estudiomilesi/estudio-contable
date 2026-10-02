const fs = require('fs');
let c = fs.readFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', 'utf8');
c = c.replace(
  /await sendEmail\(\s*client\.email,\s*`Recibo de Pago - \$\{client\.name\}`,\s*htmlContent,\s*senderEmail\s*\);/g,
  `await sendEmail(
      client.email,
      \`Recibo de Pago - \${client.name}\`,
      htmlContent,
      [], // No attachments
      senderEmail
    );`
);
fs.writeFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', c);
