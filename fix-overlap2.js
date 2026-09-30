const fs = require('fs');
let content = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');

const regexToReplace = /\/\/ Find all potential invoice numbers[\s\S]*?const letra = getLetter/i;

const newLogic = `// Find all potential invoice numbers (00000-00000000)
      const allMatches = [...text.matchAll(/(\\d{4,5})[-_](\\d{8})/g)];
      let foundPv = null;
      let foundNro = null;
      
      for (const m of allMatches) {
        // Look at only 15 chars back to avoid overlap
        const precedingText = text.substring(Math.max(0, m.index - 15), m.index).toLowerCase();
        
        if (precedingText.includes('brutos') || precedingText.includes('iibb')) {
          continue;
        }
        
        if (precedingText.includes('comp') || precedingText.includes('cbte') || precedingText.includes('nro') || precedingText.includes('factura')) {
          foundPv = m[1];
          foundNro = m[2];
          break;
        }
        if (!foundPv) {
          foundPv = m[1];
          foundNro = m[2];
        }
      }
      
      if (foundPv && foundNro) {
        pv = foundPv.padStart(4, '0');
        nro = foundNro;
      } else {
        const pvMatch = text.match(/Punto\\s+de\\s+Venta[\\s\\S]{0,50}?(\\d{4,5})/i);
        const nroMatch = text.match(/(?:Comp|Cbte)?[.\\s]*Nro[.\\s:]*(\\d{8})/i);
        if (pvMatch && nroMatch) {
          pv = pvMatch[1].padStart(4, '0');
          nro = nroMatch[1];
        }
      }
    }

    const letra = getLetter`;

content = content.replace(regexToReplace, newLogic);
fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', content);
console.log('Fixed correctly');
