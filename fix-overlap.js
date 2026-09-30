const fs = require('fs');
let content = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');

const oldLogic = `      // Find all potential invoice numbers (00000-00000000)
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

const newLogic = `      // NEW ROBUST LOGIC
      const allMatches = [...text.matchAll(/(\\d{4,5})[-_](\\d{8})/g)];
      let foundPv = null;
      let foundNro = null;
      
      for (const m of allMatches) {
        // Look at the 15 characters immediately preceding this number to avoid cross-line contamination
        const precedingText = text.substring(Math.max(0, m.index - 15), m.index).toLowerCase();
        
        // If it explicitly says 'brutos' or 'iibb' right before it, definitely skip
        if (precedingText.includes('brutos') || precedingText.includes('iibb')) {
          continue;
        }
        
        // If it says 'comp', 'cbte', 'nro', 'factura', 'nota', we found it!
        if (precedingText.includes('comp') || precedingText.includes('cbte') || precedingText.includes('nro') || precedingText.includes('factura')) {
          foundPv = m[1];
          foundNro = m[2];
          break; // Stop looking, we found the right one
        }
        
        // If we haven't found any yet, store this as a fallback
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
      }`;

if (content.includes('// Find all potential invoice numbers')) {
  content = content.replace(oldLogic, newLogic);
  fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', content);
  console.log('Fixed overlapping precedingText bug');
} else {
  console.log('Could not find old logic block to replace');
}
