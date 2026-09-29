const fs = require('fs');

let modal = fs.readFileSync('src/components/ImportAFIPModal.tsx', 'utf-8');

const target2 = `const txType = isNotaCredito ? 'PAYMENT' : 'CHARGE';
          const descriptionPrefix = isNotaCredito ? 'NC ' : 'Factura ';
          
          return {`;

const replacement2 = `const txType = isNotaCredito ? 'PAYMENT' : 'CHARGE';
          
          let parsedTipoDesc = tipoComp;
          const matchCode = tipoComp.match(/^(\\d+)/);
          if (matchCode) {
            const code = parseInt(matchCode[1], 10);
            let letter = '';
            if ([1, 2, 3, 4, 5].includes(code)) letter = 'A';
            if ([6, 7, 8, 9, 10].includes(code)) letter = 'B';
            if ([11, 12, 13, 15].includes(code)) letter = 'C';
            if ([51, 52, 53].includes(code)) letter = 'M';
            
            const docName = isNotaCredito ? 'NC' : 'FACTURA';
            const codeStr = \`Cod. \${code.toString().padStart(2, '0')}\`;
            parsedTipoDesc = \`\${docName} \${letter} \${codeStr}\`.trim();
          } else {
             parsedTipoDesc = \`\${isNotaCredito ? 'NC' : 'FACTURA'} \${tipoComp}\`.trim();
          }

          const finalDescription = \`\${parsedTipoDesc} \${ptoVta}-\${nroDesde}\`.replace(/\\s+/g, ' ');
          
          return {`;

modal = modal.replace(target2, replacement2);

modal = modal.replace(
  `description: \`\${descriptionPrefix}\${tipoComp} \${ptoVta}-\${nroDesde}\`.trim(),`,
  `description: finalDescription,`
);

fs.writeFileSync('src/components/ImportAFIPModal.tsx', modal);
