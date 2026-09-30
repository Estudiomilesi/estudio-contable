const fs = require('fs');
let content = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');

const regexToReplace = /      \/\/ Try to find FACTURA\/NC followed by Nro explicitly[\s\S]*?      \}/;

const newLogic = `      // Find all potential invoice numbers (00000-00000000)
      const allMatches = [...text.matchAll(/(\\d{4,5})[-_](\\d{8})/g)];
      let foundPv = null;
      let foundNro = null;
      
      for (const m of allMatches) {
        // Look at the 40 characters immediately preceding this number
        const precedingText = text.substring(Math.max(0, m.index - 40), m.index).toLowerCase();
        
        // If it's an "Ingresos Brutos" number, skip it!
        if (precedingText.includes('brutos')) {
          continue;
        }
        
        // If we haven't found one yet, or if this one is explicitly marked as "Comp", take it
        if (!foundPv || precedingText.includes('comp') || precedingText.includes('cbte')) {
          foundPv = m[1];
          foundNro = m[2];
        }
      }
      
      if (foundPv && foundNro) {
        pv = foundPv.padStart(4, '0');
        nro = foundNro;
      } else {
        // Absolute fallback if no 0000-00000000 format is found
        const pvMatch = text.match(/Punto\\s+de\\s+Venta[\\s\\S]{0,50}?(\\d{4,5})/i);
        const nroMatch = text.match(/(?:Comp|Cbte)?[.\\s]*Nro[.\\s:]*(\\d{8})/i);
        if (pvMatch && nroMatch) {
          pv = pvMatch[1].padStart(4, '0');
          nro = nroMatch[1];
        }
      }`;

content = content.replace(regexToReplace, newLogic);
fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', content);
console.log('Robust logic applied');
