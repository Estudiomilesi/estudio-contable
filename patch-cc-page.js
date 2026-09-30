const fs = require('fs');

let page = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

// Replace state definition
page = page.replace(
  "const [qcCheckDetails, setQcCheckDetails] = useState({ bank: '', number: '', issueDate: '', dueDate: '' });",
  "const [qcCheckDetails, setQcCheckDetails] = useState({ bank: '', number: '', issueDate: '', dueDate: '', isEcheq: false });"
);

// Replace state reset
page = page.replace(
  "setQcCheckDetails({ bank: '', number: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0] });",
  "setQcCheckDetails({ bank: '', number: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], isEcheq: false });"
);

// Replace JSX form to add checkbox
const jsxTarget = `<div>
                          <label className="block text-xs font-bold text-gray-700">F. Cobro</label>
                          <input type="date" required value={qcCheckDetails.dueDate} onChange={e => setQcCheckDetails({...qcCheckDetails, dueDate: e.target.value})} className="w-full text-sm border rounded p-1" />
                        </div>
                      </div>`;

const jsxReplacement = `<div>
                          <label className="block text-xs font-bold text-gray-700">F. Cobro</label>
                          <input type="date" required value={qcCheckDetails.dueDate} onChange={e => setQcCheckDetails({...qcCheckDetails, dueDate: e.target.value})} className="w-full text-sm border rounded p-1" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" id="qcEcheq" checked={qcCheckDetails.isEcheq} onChange={e => setQcCheckDetails({...qcCheckDetails, isEcheq: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="qcEcheq" className="text-sm font-semibold text-gray-700">Es E-Cheq (Cheque Electrónico)</label>
                      </div>`;

page = page.replace(jsxTarget, jsxReplacement);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', page);
