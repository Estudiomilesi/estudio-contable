const fs = require('fs');

// Fix 1: cobro-rapido/route.ts
let cobroRoute = fs.readFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', 'utf-8');

cobroRoute = cobroRoute.replace(
  `    const accountTx = await prisma.accountTransaction.create({
      data: {
        clientId: clientId,
        date: txDate,
        type: 'PAYMENT',
        amount: txAmount,
        description: \`Pago ingresado en \${account} - \${description || ''}\`,
      }
    });`,
  `    const accountTx = await prisma.accountTransaction.create({
      data: {
        clientId: clientId,
        date: txDate,
        type: 'PAYMENT',
        amount: txAmount,
        description: \`Pago ingresado en \${account} - \${description || ''}\`,
      }
    });

    // 2.5 Vincular el cobro a la caja
    await prisma.treasuryTransaction.update({
      where: { id: treasuryTx.id },
      data: { accountTransactionId: accountTx.id }
    });`
);
fs.writeFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', cobroRoute);

// Fix 2: tesoreria/route.ts
let tesoreriaRoute = fs.readFileSync('src/app/api/tesoreria/route.ts', 'utf-8');
tesoreriaRoute = tesoreriaRoute.replace(
  `    if (data.type === 'INCOME' && data.category === 'Honorarios' && data.clientId) {
      const accountTx = await prisma.accountTransaction.create({
        data: {
          clientId: data.clientId,
          date: parseToUtcNoon(data.date),
          type: 'PAYMENT',
          amount: Math.abs(txAmount),
          description: \`Pago ingresado en \${data.account} - \${data.description || ''}\`,
        }
      });`,
  `    if (data.type === 'INCOME' && data.category === 'Honorarios' && data.clientId) {
      const accountTx = await prisma.accountTransaction.create({
        data: {
          clientId: data.clientId,
          date: parseToUtcNoon(data.date),
          type: 'PAYMENT',
          amount: Math.abs(txAmount),
          description: \`Pago ingresado en \${data.account} - \${data.description || ''}\`,
        }
      });
      
      await prisma.treasuryTransaction.update({
        where: { id: nuevaTransaccion.id },
        data: { accountTransactionId: accountTx.id }
      });`
);
fs.writeFileSync('src/app/api/tesoreria/route.ts', tesoreriaRoute);

