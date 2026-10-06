const fs = require('fs');
let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

const targetAutoTable = `    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      theme: 'plain',
      headStyles: { 
        textColor: [148, 163, 184], // slate-400
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        lineColor: [226, 232, 240], // slate-200
        lineWidth: { bottom: 0.5 }
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 6,
        textColor: [51, 65, 85]
      },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 28 },
        1: { cellWidth: 'auto' },
        2: { halign: 'right', textColor: [220, 38, 38], fontStyle: 'bold', cellWidth: 30 },
        3: { halign: 'right', textColor: [22, 163, 74], fontStyle: 'bold', cellWidth: 30 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 30 }
      }
    });`;

const replacedAutoTable = `    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      theme: 'plain',
      headStyles: { 
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        lineColor: [226, 232, 240], // slate-200
        lineWidth: { bottom: 0.5 }
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        textColor: [51, 65, 85]
      },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { halign: 'right', textColor: [220, 38, 38], fontStyle: 'bold' },
        3: { halign: 'right', textColor: [22, 163, 74], fontStyle: 'bold' },
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });`;

if (c.includes('autoTable(doc, {')) {
  c = c.replace(targetAutoTable, replacedAutoTable);
  fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
  console.log("Replaced successfully in cuentas-corrientes/page.tsx");
} else {
  console.log("Could not find target in cuentas-corrientes/page.tsx");
}
