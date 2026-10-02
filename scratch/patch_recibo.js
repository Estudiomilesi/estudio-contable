const fs = require('fs');
let c = fs.readFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', 'utf8');

const oldMapCode = `    const chargesMap = new Map();
    for (const tx of txs) {
      for (const app of tx.chargesCovered) {
        if (!chargesMap.has(app.charge.id)) {
          chargesMap.set(app.charge.id, { desc: app.charge.description, applied: 0 });
        }
        chargesMap.get(app.charge.id).applied += app.amount;
      }
    }`;

const newMapCode = `    const chargesMap = new Map();
    for (const tx of txs) {
      for (const app of tx.chargesCovered) {
        if (!chargesMap.has(app.charge.id)) {
          chargesMap.set(app.charge.id, { 
            desc: app.charge.description, 
            receiptNumber: app.charge.receiptNumber,
            date: app.charge.date,
            applied: 0 
          });
        }
        chargesMap.get(app.charge.id).applied += app.amount;
      }
    }`;

c = c.replace(oldMapCode, newMapCode);

const oldRowCode = `      for (const [_, charge] of chargesMap) {
        comprobantesHtml += \`<tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">\${charge.desc || 'Comprobante'}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: right;">$\${charge.applied.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
        </tr>\`;
      }`;

const newRowCode = `      for (const [_, charge] of chargesMap) {
        let label = charge.desc || 'Comprobante';
        if (charge.receiptNumber) {
           label += \` - N° \${charge.receiptNumber}\`;
        }
        if (charge.date) {
           const d = new Date(charge.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
           label += \` (\${d})\`;
        }
        
        comprobantesHtml += \`<tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">\${label}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: right;">$\${charge.applied.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
        </tr>\`;
      }`;

c = c.replace(oldRowCode, newRowCode);

fs.writeFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', c);
