const fs = require('fs');
let content = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');

const oldRegexBlock = `      const pvMatch = text.match(/Punto\\s+de\\s+Venta[\\s\\S]{0,50}?(\\d{4,5})/i);
      const nroMatch = text.match(/Punto\\s+de\\s+Venta[\\s\\S]{0,150}?(\\d{8})/i);
      
      if (pvMatch && nroMatch) {
        pv = pvMatch[1].padStart(4, '0');
        nro = nroMatch[1];
      } else {
        const directNroMatch = text.match(/Nro[.\\s:]*(\\d{4,5})[-_](\\d{8})/i);
        if (directNroMatch) {
          pv = directNroMatch[1].padStart(4, '0');
          nro = directNroMatch[2];
        }
      }`;

const newRegexBlock = `      // Try to find FACTURA/NC followed by Nro explicitly to avoid matching "Ingresos Brutos Nro: XXXX"
      const headerMatch = text.match(/(?:FACTURA|NOTA DE CR.DITO|RECIBO|CBTE|COMPROBANTE)[\\s\\S]{0,60}?Nro[.\\s:]*(\\d{4,5})[-_](\\d{8})/i);
      if (headerMatch) {
        pv = headerMatch[1].padStart(4, '0');
        nro = headerMatch[2];
      } else {
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
      }`;

if (content.includes('const pvMatch = text.match(/Punto\\s+de\\s+Venta')) {
  content = content.replace(oldRegexBlock, newRegexBlock);
  fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', content);
  console.log('Regex updated successfully');
} else {
  console.log('Regex block not found');
}
