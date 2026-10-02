const fs = require('fs');

let c = fs.readFileSync('src/app/api/cuentas-corrientes/enviar-reporte/route.ts', 'utf8');

c = c.replace(
  /<p class="text-content" style="color: #334155; font-size: 15px; line-height: 1\.5; margin-top: 25px;">Por favor, recordá enviarnos el comprobante de transferencia una vez realizado el pago para poder imputarlo correctamente en tu cuenta\.<\/p>/g,
  `\${isDebt ? \`<p class="text-content" style="color: #334155; font-size: 15px; line-height: 1.5; margin-top: 25px;">Por favor, recordá enviarnos el comprobante de transferencia una vez realizado el pago para poder imputarlo correctamente en tu cuenta.</p>\` : ''}`
);

fs.writeFileSync('src/app/api/cuentas-corrientes/enviar-reporte/route.ts', c);

let page = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

page = page.replace(
  /fetch\('\/api\/cuentas-corrientes\/enviar-reporte',\s*\{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json'\s*\},\s*body: JSON\.stringify\(\{\s*clientId: selectedClientId,\s*viewMode: viewMode\s*\}\)\s*\}\)/g,
  `fetch('/api/cuentas-corrientes/enviar-recibo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountTxIds: resData.results.map((r: any) => r.accountTxId) })
              })`
);

page = page.replace(
  /const res = await fetch\('\/api\/cuentas-corrientes\/cobro-rapido',\s*\{([\s\S]*?)\}\);([\s\S]*?)if \(res\.ok\) \{/g,
  `const res = await fetch('/api/cuentas-corrientes/cobro-rapido', {$1});$2const resData = await res.json();\n      if (res.ok) {`
);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', page);
