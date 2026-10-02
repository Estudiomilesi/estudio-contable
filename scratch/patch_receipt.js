const fs = require('fs');
let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

const target = `      if (res.ok) {
        setIsQuickCollectOpen(false);
        setSelectedChargeIds(new Set());
        fetchClientes();
      } else {`;

const replacement = `      if (res.ok) {
        setIsQuickCollectOpen(false);
        setSelectedChargeIds(new Set());
        fetchClientes();
        
        if (qcAccount === 'CAJA' || qcAccount === 'CAJA IVA' || qcAccount === 'CHEQUES') {
          if (confirm('Cobro registrado exitosamente. ¿Deseás enviarle el recibo actualizado al cliente por email ahora?')) {
            try {
              const emailRes = await fetch('/api/cuentas-corrientes/enviar-reporte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: selectedClientId, viewMode: viewMode })
              });
              const emailData = await emailRes.json();
              if (emailData.success) {
                alert('Recibo enviado correctamente.');
              } else {
                alert('Error al enviar el recibo: ' + emailData.error);
              }
            } catch (e) {
              alert('Error al enviar el recibo');
            }
          }
        }
      } else {`;

c = c.replace(target, replacement);
fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
