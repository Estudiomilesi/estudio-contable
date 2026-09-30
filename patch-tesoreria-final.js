const fs = require('fs');
let page = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf8');

// Patch Check type
page = page.replace(
  '  status: string;\n  clientId: string | null;',
  '  status: string;\n  isEcheq: boolean;\n  clientId: string | null;'
);

// Patch add new check row
page = page.replace(
  "setIncomingChecks([...incomingChecks, { bank: '', number: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0] }])",
  "setIncomingChecks([...incomingChecks, { bank: '', number: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], isEcheq: false }])"
);

fs.writeFileSync('src/app/tesoreria/page.tsx', page);
