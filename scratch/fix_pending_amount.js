const fs = require('fs');

let c = fs.readFileSync('src/app/api/cuentas-corrientes/enviar-reporte/route.ts', 'utf8');

c = c.replace(
  /const debeStr = isCharge \? `\$\$\{tx\.amount\.toLocaleString\('es-AR', \{minimumFractionDigits: 2\}\)\}` : '-';\r?\n\s*const haberStr = !isCharge \? `\$\$\{tx\.amount\.toLocaleString\('es-AR', \{minimumFractionDigits: 2\}\)\}` : '-';\r?\n\s*const amountStr = `\$\$\{tx\.amount\.toLocaleString\('es-AR', \{minimumFractionDigits: 2\}\)\}`;/,
  `        const applied = tx.type === 'CHARGE' ? tx.paymentsApplied?.reduce((sum, app) => sum + app.amount, 0) || 0 : tx.chargesCovered?.reduce((sum, app) => sum + app.amount, 0) || 0;
        const remaining = tx.amount - applied;
        const displayAmount = viewMode === 'PENDING' ? remaining : tx.amount;
        
        const debeStr = isCharge ? \`$\${displayAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}\` : '-';
        const haberStr = !isCharge ? \`$\${displayAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}\` : '-';
        const amountStr = \`$\${displayAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}\`;`
);

c = c.replace(
  /const saldoStr = `\$\$\{tx\.runningBalance\.toLocaleString\('es-AR', \{minimumFractionDigits: 2\}\)\}`;/,
  `const saldoStr = viewMode === 'PENDING' ? '-' : \`$\${tx.runningBalance.toLocaleString('es-AR', {minimumFractionDigits: 2})}\`;`
);

// We should also patch the debt notices cron job just in case it has the same pending amount bug!
let d = fs.readFileSync('src/app/api/cron/avisos-deuda/route.ts', 'utf8');

d = d.replace(
  /const debe = isCharge \? `\$\$\{tx\.amount\.toLocaleString\('es-AR', \{minimumFractionDigits: 2, maximumFractionDigits: 2\}\)\}` : '-';\r?\n\s*const haber = !isCharge \? `\$\$\{tx\.amount\.toLocaleString\('es-AR', \{minimumFractionDigits: 2, maximumFractionDigits: 2\}\)\}` : '-';/,
  `        const applied = tx.type === 'CHARGE' ? tx.paymentsApplied?.reduce((sum, app) => sum + app.amount, 0) || 0 : tx.chargesCovered?.reduce((sum, app) => sum + app.amount, 0) || 0;
        const displayAmount = tx.amount - applied;
        const debe = isCharge ? \`$\${displayAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}\` : '-';
        const haber = !isCharge ? \`$\${displayAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}\` : '-';`
);

fs.writeFileSync('src/app/api/cuentas-corrientes/enviar-reporte/route.ts', c);
fs.writeFileSync('src/app/api/cron/avisos-deuda/route.ts', d);
