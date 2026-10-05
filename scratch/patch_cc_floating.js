const fs = require('fs');
let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

const target = `<span className="font-bold">\n              {selectedChargeIds.size} seleccionados\n            </span>`;
const replacement = `<span className="font-bold flex items-center gap-2">\n              {selectedChargeIds.size} seleccionados\n              <span className="bg-indigo-800 text-indigo-100 px-2 py-0.5 rounded text-sm whitespace-nowrap">\n                ($ {Array.from(selectedChargeIds).reduce((sum, id) => {\n                  const charge = selectedClient.transactions.find(tx => tx.id === id);\n                  return sum + (charge ? charge.amount - getAppliedAmount(charge) : 0);\n                }, 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})\n              </span>\n            </span>`;

c = c.replace(target, replacement);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
