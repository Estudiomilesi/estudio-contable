const fs = require('fs');
let content = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');

const regexToReplace = /\/\/ Find all potential invoice numbers[\s\S]*?const letra = getLetter/i;

const newLogic = `// NEWEST BULLETPROOF LOGIC
      
      // 1. Find Punto de Venta
      const pvMatch = text.match(/Punto\\s+de\\s+Venta[\\s\\S]{0,50}?(\\d{4,5})/i) || text.match(/(?:PV|Punto de Venta)[.\\s:]*(\\d{4,5})/i);
      if (pvMatch) {
        pv = pvMatch[1].padStart(4, '0');
      }

      // 2. Find Comprobante Nro
      // AFIP can format it as "Comp. Nro: 00000654" or "00002-00000654"
      
      const nroMatches = [...text.matchAll(/Nro[.\\s:]*(\\d{8})/gi)];
      let foundNro = null;
      
      for (const m of nroMatches) {
        const precedingText = text.substring(Math.max(0, m.index - 25), m.index).toLowerCase();
        
        // Skip if it is an Ingresos Brutos number
        if (precedingText.includes('brutos') || precedingText.includes('iibb')) {
          continue;
        }
        
        // Prioritize if it clearly says "Comp" or "Cbte"
        if (precedingText.includes('comp') || precedingText.includes('cbte') || precedingText.includes('factura')) {
          foundNro = m[1];
          break;
        }
        
        if (!foundNro) {
          foundNro = m[1];
        }
      }
      
      // Also look for explicit XXXX-XXXXXXXX pattern in case "Nro" is missing
      if (!foundNro) {
        const dashMatches = [...text.matchAll(/(\\d{4,5})[-_](\\d{8})/g)];
        for (const m of dashMatches) {
          const pre = text.substring(Math.max(0, m.index - 25), m.index).toLowerCase();
          if (pre.includes('brutos') || pre.includes('iibb')) continue;
          if (!pvMatch) pv = m[1].padStart(4, '0');
          foundNro = m[2];
          break;
        }
      }
      
      if (foundNro) {
        nro = foundNro;
      }
    }

    const letra = getLetter`;

content = content.replace(regexToReplace, newLogic);
fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', content);
console.log('Fixed logic fully');
