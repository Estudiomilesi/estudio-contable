const fs = require('fs');

const routeReporte = 'src/app/api/cuentas-corrientes/enviar-reporte/route.ts';
let contentReporte = fs.readFileSync(routeReporte, 'utf8');

contentReporte = contentReporte.replace(
  /if \(\!process\.env\.SMTP_USER\) \{[\s\S]*?\} else \{[\s\S]*?await transporter\.sendMail\(\{[\s\S]*?\}\);\r?\n    \}/,
  `await sendEmail(correosDestino, \`\${reportTitle} - \${firma}\`, htmlEmail, undefined, senderEmail);`
);

fs.writeFileSync(routeReporte, contentReporte);
console.log('Fixed enviar-reporte');
