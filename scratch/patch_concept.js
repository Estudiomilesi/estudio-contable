const fs = require('fs');

let c = fs.readFileSync('src/app/api/comprobantes/enviar-html/route.ts', 'utf8');

c = c.replace(
  `    let periodoStr = '';
    const matchPeriodo = (tx.description || '').match(/- ([A-Za-z]+ \\d{4})$/);
    if (matchPeriodo) {
      periodoStr = matchPeriodo[1];
    } else {
      const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      periodoStr = \`\${meses[tx.date.getMonth()]} \${tx.date.getFullYear()}\`;
    }

    // Dividir concepto de periodo si está en la descripción ("Honorarios - Septiembre 2026")
    let conceptoPrincipal = 'Honorarios Contables';
    let conceptoSecundario = 'Abono Mensual';`,
  `    let periodoStr = '';
    let conceptoStr = tx.description || 'Comprobante';
    const matchPeriodo = (tx.description || '').match(/\\s*-\\s*([A-Za-z]+ \\d{4})$/);
    if (matchPeriodo) {
      periodoStr = matchPeriodo[1];
      conceptoStr = tx.description.replace(matchPeriodo[0], '').trim();
    } else {
      const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      periodoStr = \`\${meses[tx.date.getMonth()]} \${tx.date.getFullYear()}\`;
    }`
);

c = c.replace(
  `\${conceptoPrincipal} - \${conceptoSecundario}`,
  `\${conceptoStr}`
);

fs.writeFileSync('src/app/api/comprobantes/enviar-html/route.ts', c);
