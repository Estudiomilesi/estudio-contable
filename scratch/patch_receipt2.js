const fs = require('fs');
let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

const targetStr = `      if (res.ok) {
        setIsQuickCollectOpen(false);
        setSelectedChargeIds(new Set());
        fetchClientes();
      } else {`;

// Standardize newlines before matching
c = c.replace(/\\r\\n/g, '\\n');

const newStr = `      if (res.ok) {
        setIsQuickCollectOpen(false);
        setSelectedChargeIds(new Set());
        fetchClientes();
        
        if (qcAccount === 'CAJA' || qcAccount === 'CAJA IVA' || qcAccount === 'CHEQUES') {
          if (confirm('Cobro registrado exitosamente. ¿Deseás enviarle el recibo actualizado al cliente por email ahora?')) {
            try {
              fetch('/api/cuentas-corrientes/enviar-reporte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: selectedClientId, viewMode: viewMode })
              }).then(r => r.json()).then(data => {
                if (data.success) alert('Recibo enviado correctamente.');
                else alert('Error al enviar el recibo: ' + data.error);
              });
            } catch (e) {
              alert('Error al enviar el recibo');
            }
          }
        }
      } else {`;

c = c.replace(targetStr, newStr);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
