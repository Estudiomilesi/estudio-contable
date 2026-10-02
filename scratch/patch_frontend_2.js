const fs = require('fs');

let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

c = c.replace(
  /setQcAmount\(totalToCollect\.toString\(\)\);\s*setQcAccount\('CAJA'\);\s*setQcDescription\(''\);\s*setQcCheckDetails\(\{ bank: '', number: '', issueDate: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\], dueDate: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\], isEcheq: false \}\);/g,
  `setQcPayments([{
      id: Date.now(),
      amount: totalToCollect.toString(),
      account: 'CAJA',
      description: '',
      checkDetails: { bank: '', number: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], isEcheq: false }
    }]);`
);

c = c.replace(
  /amount: parseFloat\(qcAmount\),\s*account: qcAccount,\s*description: qcDescription,\s*checkDetails: qcAccount === 'CHEQUES' \? qcCheckDetails : undefined,/g,
  `payments: qcPayments.map(p => ({
            amount: parseFloat(p.amount),
            account: p.account,
            description: p.description,
            checkDetails: p.account === 'CHEQUES' ? p.checkDetails : undefined
          })),`
);

c = c.replace(
  /if \(qcAccount === 'CAJA' \|\| qcAccount === 'CAJA IVA' \|\| qcAccount === 'CHEQUES'\)/g,
  `const accountsUsed = qcPayments.map(p => p.account);
        if (accountsUsed.includes('CAJA') || accountsUsed.includes('CAJA IVA') || accountsUsed.includes('CHEQUES'))`
);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
