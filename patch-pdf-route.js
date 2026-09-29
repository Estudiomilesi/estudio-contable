const fs = require('fs');

let api = fs.readFileSync('src/app/api/comprobantes/importar/pdf/route.ts', 'utf-8');

const target1 = `description: \`\${isNotaCredito ? 'NC' : 'Factura'} \${pv}-\${nro}\`,`;

const replacement1 = `description: (() => {
          const getLetter = (code: number) => {
            if ([1, 2, 3, 4, 5].includes(code)) return 'A';
            if ([6, 7, 8, 9, 10].includes(code)) return 'B';
            if ([11, 12, 13, 15].includes(code)) return 'C';
            if ([51, 52, 53].includes(code)) return 'M';
            return '';
          };
          const letter = getLetter(compCode);
          const codeStr = compCode > 0 ? \`Cod. \${compCode.toString().padStart(2, '0')}\` : '';
          const docName = isNotaCredito ? 'NC' : 'FACTURA';
          const parts = [docName];
          if (letter) parts.push(letter);
          if (codeStr) parts.push(codeStr);
          parts.push(\`\${pv}-\${nro}\`);
          return parts.join(' ').replace(/\\s+/g, ' ');
        })(),`;

api = api.replace(target1, replacement1);

fs.writeFileSync('src/app/api/comprobantes/importar/pdf/route.ts', api);
