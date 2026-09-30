const fs = require('fs');
let page = fs.readFileSync('src/app/tesoreria/cheques/page.tsx', 'utf8');

page = page.replace(
  '{check.number}',
  '{check.number}\n                    {check.isEcheq && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold uppercase tracking-wider">Echeq</span>}'
);

fs.writeFileSync('src/app/tesoreria/cheques/page.tsx', page);
