const fs = require('fs');

let c = fs.readFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', 'utf8');

c = c.replace('const results = [];', 'const results = [];\n    const alerts: any[] = [];');

c = c.replace(
  'results.push({ treasuryTxId: treasuryTx.id, accountTxId: accountTx.id });',
  `results.push({ treasuryTxId: treasuryTx.id, accountTxId: accountTx.id });
      
      for (const app of createdApplications) {
        if (app.charge.collaboratorAmount && app.charge.collaboratorAmount > 0) {
          const proportion = app.amount / app.charge.amount;
          const amountForCollab = app.charge.collaboratorAmount * proportion;
          alerts.push({ collaborator: app.charge.collaboratorName || 'Colaborador sin nombre', amount: amountForCollab, client: app.charge.client?.name || 'Cliente' });
        }
      }`
);

c = c.replace(
  'return NextResponse.json({ success: true, results }, { status: 201 });',
  'return NextResponse.json({ success: true, results, alerts }, { status: 201 });'
);

fs.writeFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', c);
