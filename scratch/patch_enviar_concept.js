const fs = require('fs');

let c = fs.readFileSync('src/app/api/comprobantes/enviar/route.ts', 'utf8');

c = c.replace(
  `    let conceptoPrincipal = 'Honorarios Contables';
    let conceptoSecundario = 'Abono Mensual';`,
  `    let conceptoStr = tx.description || 'Comprobante';
    const matchConcepto = (tx.description || '').match(/\\s*-\\s*([A-Za-z]+ \\d{4})$/);
    if (matchConcepto) {
      conceptoStr = tx.description.replace(matchConcepto[0], '').trim();
    }`
);

c = c.replace(
  `\${conceptoPrincipal} - \${conceptoSecundario}`,
  `\${conceptoStr}`
);

fs.writeFileSync('src/app/api/comprobantes/enviar/route.ts', c);
