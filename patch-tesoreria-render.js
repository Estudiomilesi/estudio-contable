const fs = require('fs');

let page = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf8');

const t1 = `<div className="font-bold">{c.bank} N {c.number}</div>`;
const r1 = `<div className="font-bold">{c.bank} N° {c.number} {c.isEcheq && <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded ml-1">Echeq</span>}</div>`;

const t2 = `{c.bank} - N {c.number}`;
const r2 = `{c.bank} - N° {c.number} {c.isEcheq && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">Echeq</span>}`;

// Just in case the file has N°
const t1_alt = `<div className="font-bold">{c.bank} N° {c.number}</div>`;
const t2_alt = `{c.bank} - N° {c.number}`;

page = page.split(t1).join(r1);
page = page.split(t1_alt).join(r1);
page = page.split(t2).join(r2);
page = page.split(t2_alt).join(r2);

fs.writeFileSync('src/app/tesoreria/page.tsx', page);
