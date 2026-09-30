const fs = require('fs');
let content = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');

// The file currently has a syntax error because of duplicated `} else {` blocks.
// Let's just find the `const letra = getLetter` line and replace everything from the bad `} else { // Fallback to Punto de Venta structure` down to it.

const badPart = `      } else {
        // Fallback to Punto de Venta structure
        const pvMatch = text.match(/Punto\\s+de\\s+Venta[\\s\\S]{0,50}?(\\d{4,5})/i);
        const nroMatch = text.match(/(?:Comp|Cbte)?[.\\s]*Nro[.\\s:]*(\\d{8})/i);
        
        if (pvMatch && nroMatch) {
          pv = pvMatch[1].padStart(4, '0');
          nro = nroMatch[1];
        } else {
          // Last resort: find any Nro XXXX-XXXXXXXX that doesn't belong to Ingresos Brutos
          const allNros = [...text.matchAll(/(?:(?<!Brutos\\s*)(?<!Brutos\\s*Nro[.\\s:]*))Nro[.\\s:]*(\\d{4,5})[-_](\\d{8})/gi)];
          if (allNros.length > 0) {
            pv = allNros[0][1].padStart(4, '0');
            nro = allNros[0][2];
          } else {
            const fallback = text.match(/Nro[.\\s:]*(\\d{4,5})[-_](\\d{8})/i);
            if (fallback) {
               pv = fallback[1].padStart(4, '0');
               nro = fallback[2];
            }
          }
        }
      }
    }`;

content = content.replace(badPart, '    }');
fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', content);
console.log('Fixed file');
