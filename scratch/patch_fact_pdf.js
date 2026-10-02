const fs = require('fs');

let c = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

c = c.replace(
  `import { useEffect, useState, useMemo } from 'react';`,
  `import { useEffect, useState, useMemo } from 'react';\nimport { generatePdfDoc } from '@/lib/pdfGenerator';`
);

const fetchAndSendPdf = `
      const data = await res.json();
      if (res.ok) {
        if (data.requiresPdf && data.requiresPdf.length > 0) {
          // Fetch banks to generate PDF
          const bancosRes = await fetch('/api/bancos');
          const bancos = await bancosRes.json();
          
          for (const txId of data.requiresPdf) {
            try {
              const compRes = await fetch(\`/api/comprobantes/\${txId}\`);
              if (!compRes.ok) continue;
              const compData = await compRes.json();
              
              const doc = await generatePdfDoc(compData, bancos);
              const pdfBase64 = doc.output('datauristring');
              
              await fetch('/api/comprobantes/enviar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: txId, pdfBase64 })
              });
            } catch (err) {
              console.error('Error enviando PDF para', txId, err);
            }
          }
        }
        
        alert(data.message);
        fetchClientes(); // Refresh to show the new history
        setSelectedIds(new Set());
      } else {`;

c = c.replace(
  /      const data = await res\.json\(\);\n      if \(res\.ok\) \{\n        alert\(data\.message\);\n        fetchClientes\(\); \/\/ Refresh to show the new history\n        setSelectedIds\(new Set\(\)\);\n      \} else \{/,
  fetchAndSendPdf
);

fs.writeFileSync('src/app/facturacion/page.tsx', c);
