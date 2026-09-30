const fs = require('fs');
let page = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf8');

// 1. Check type
page = page.replace(
  '  status: string;\n  clientId: string | null;',
  '  status: string;\n  isEcheq: boolean;\n  clientId: string | null;'
);

// 2. IncomingChecks state
page = page.replace(
  /dueDate: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\r?\n\s*\}\]\);/,
  "dueDate: new Date().toISOString().split('T')[0],\n    isEcheq: false\n  }]);"
);

// 3. Form Add Row
page = page.replace(
  "setIncomingChecks([...incomingChecks, { bank: '', number: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0] }])",
  "setIncomingChecks([...incomingChecks, { bank: '', number: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], isEcheq: false }])"
);

// 4. Form Reset
page = page.replace(
  "setIncomingChecks([{ number: '', bank: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0] }]);",
  "setIncomingChecks([{ number: '', bank: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], isEcheq: false }]);"
);

// 5. JSX Checkbox in Add Form
const jsxTarget = `<div>
                            <label className="block text-xs font-bold text-gray-700">F. Cobro</label>
                            <input type="date" required value={c.dueDate} onChange={e => {
                              const newC = [...incomingChecks];
                              newC[i].dueDate = e.target.value;
                              setIncomingChecks(newC);
                            }} className="w-full text-sm border rounded p-1" />
                          </div>
                        </div>`;

const jsxReplacement = `<div>
                            <label className="block text-xs font-bold text-gray-700">F. Cobro</label>
                            <input type="date" required value={c.dueDate} onChange={e => {
                              const newC = [...incomingChecks];
                              newC[i].dueDate = e.target.value;
                              setIncomingChecks(newC);
                            }} className="w-full text-sm border rounded p-1" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input type="checkbox" id={\`echeq-\${i}\`} checked={c.isEcheq || false} onChange={e => {
                            const newC = [...incomingChecks];
                            newC[i].isEcheq = e.target.checked;
                            setIncomingChecks(newC);
                          }} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <label htmlFor={\`echeq-\${i}\`} className="text-sm font-semibold text-gray-700">Es E-Cheq (Cheque Electrónico)</label>
                        </div>`;

page = page.replace(jsxTarget, jsxReplacement);

// 6. JSX Render List
page = page.replace(
  /<div className="font-bold">\{c\.bank\}[^\{]+\{c\.number\}<\/div>/g,
  '<div className="font-bold">{c.bank} N° {c.number} {c.isEcheq && <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded ml-1">Echeq</span>}</div>'
);

page = page.replace(
  /<td className="px-4 py-2 text-sm text-gray-900 font-medium">\s*\{c\.bank\}[^\{]+\{c\.number\}\s*<\/td>/g,
  '<td className="px-4 py-2 text-sm text-gray-900 font-medium">\n{c.bank} - N° {c.number} {c.isEcheq && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">Echeq</span>}\n</td>'
);

fs.writeFileSync('src/app/tesoreria/page.tsx', page);
