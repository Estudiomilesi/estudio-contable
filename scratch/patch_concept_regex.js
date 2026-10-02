const fs = require('fs');

let c = fs.readFileSync('src/app/api/comprobantes/enviar-html/route.ts', 'utf8');

c = c.replace(
  /\/\/ Extraer periodo[\s\S]*?let conceptoSecundario = 'Abono Mensual';/m,
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

fs.writeFileSync('src/app/api/comprobantes/enviar-html/route.ts', c);
