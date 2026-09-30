const fs = require('fs');

let page = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf8');

// Replace state definition
page = page.replace(
  "const [incomingChecks, setIncomingChecks] = useState([{",
  "const [incomingChecks, setIncomingChecks] = useState([{"
);

const stateResetTarget = "setIncomingChecks([{ number: '', bank: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0] }]);";
const stateResetReplacement = "setIncomingChecks([{ number: '', bank: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], isEcheq: false }]);";
page = page.replace(stateResetTarget, stateResetReplacement);

// Replace JSX form
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

fs.writeFileSync('src/app/tesoreria/page.tsx', page);
