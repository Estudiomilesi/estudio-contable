const fs = require('fs');

let page = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf8');

page = page.replace(
  /<div className="font-bold">\{c\.bank\}[^\{]+\{c\.number\}<\/div>/g,
  '<div className="font-bold">{c.bank} N° {c.number} {c.isEcheq && <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded ml-1">Echeq</span>}</div>'
);

page = page.replace(
  /<td className="px-4 py-2 text-sm text-gray-900 font-medium">\s*\{c\.bank\}[^\{]+\{c\.number\}\s*<\/td>/g,
  '<td className="px-4 py-2 text-sm text-gray-900 font-medium">\n{c.bank} - N° {c.number} {c.isEcheq && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">Echeq</span>}\n</td>'
);

fs.writeFileSync('src/app/tesoreria/page.tsx', page);
