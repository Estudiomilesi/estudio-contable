const fs = require('fs');

let page = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf8');

page = page.replace(
  'status: string;\n  clientId: string | null;',
  'status: string;\n  isEcheq: boolean;\n  clientId: string | null;'
);

fs.writeFileSync('src/app/tesoreria/page.tsx', page);
