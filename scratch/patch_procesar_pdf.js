const fs = require('fs');
let c = fs.readFileSync('src/app/api/facturacion/procesar/route.ts', 'utf8');

// Replace the email sending logic
c = c.replace(
  /        try \{\n          await sendEmail\(\n            correosDestino, \n            `Aviso de Honorarios - \$\{periodoStr\} - \$\{firma\}`, \n            htmlEmail\n          \);\n          emailsEnviados\+\+;\n        \} catch \(mailErr\) \{\n          console\.error\(`Error enviando email a \$\{cliente\.email\}:`, mailErr\);\n        \}/g,
  `        if (cliente.wantsPdfAttachment) {
          requiresPdf.push(tx.id);
        } else {
          try {
            await sendEmail(
              correosDestino, 
              \`Aviso de Honorarios - \${periodoStr} - \${firma}\`, 
              htmlEmail
            );
            emailsEnviados++;
          } catch (mailErr) {
            console.error(\`Error enviando email a \${cliente.email}:\`, mailErr);
          }
        }`
);

// Add requiresPdf to the beginning of the block
c = c.replace(
  /    let emailsEnviados = 0;/,
  `    let emailsEnviados = 0;\n    const requiresPdf: string[] = [];`
);

// Add requiresPdf to the response
c = c.replace(
  /    return NextResponse\.json\(\{ \n      message: `¡Proceso completado con éxito!\\n\\nSe generaron \$\{transacciones\.length\} comprobantes\.\\nSe enviaron \$\{emailsEnviados\} emails automáticamente\.\\n\\nPara revisar los comprobantes y enviar los de AFIP pendientes, andá a la pestaña Comprobantes\.` \n    \}, \{ status: 200 \}\);/,
  `    return NextResponse.json({ 
      message: \`¡Proceso completado con éxito!\\n\\nSe generaron \${transacciones.length} comprobantes.\\nSe enviaron \${emailsEnviados} emails automáticamente.\` + (requiresPdf.length > 0 ? \`\\nSe enviarán \${requiresPdf.length} correos con PDF adjunto.\` : ''),
      requiresPdf
    }, { status: 200 });`
);

fs.writeFileSync('src/app/api/facturacion/procesar/route.ts', c);
