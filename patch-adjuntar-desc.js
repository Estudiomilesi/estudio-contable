const fs = require('fs');

const file = 'src/app/api/comprobantes/[id]/adjuntar-afip/route.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Rename description to afipDescription
content = content.replace(
  /const description = `\$\{typeDesc\} \$\{letra\}\$\{cbteStr\}\$\{pv\}-\$\{nro\}`;/,
  "const afipDescription = `${typeDesc} ${letra}${cbteStr}${pv}-${nro}`;"
);

// 2. Remove description from prisma update
content = content.replace(
  /receiptNumber: `\$\{pv\}-\$\{nro\}`,\r?\n\s*description,\r?\n\s*isEmailed: true/,
  "receiptNumber: `${pv}-${nro}`,\n        isEmailed: true"
);

// 3. Update the HTML to use afipDescription
content = content.replace(
  /Comprobante Oficial:<\/strong> <span[^>]*>\$\{description\}<\/span>/,
  "Comprobante Oficial:</strong> <span style=\"background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #475569; white-space: nowrap;\">${afipDescription}</span>"
);

fs.writeFileSync(file, content);
console.log('Fixed adjuntar-afip description overwrite');
