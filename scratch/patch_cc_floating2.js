const fs = require('fs');
let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

c = c.replace(
  /<span className="font-bold">[\s\S]*?\{selectedChargeIds\.size\} seleccionados[\s\S]*?<\/span>/m,
  `<span className="font-bold flex items-center gap-2">
              {selectedChargeIds.size} seleccionados
              <span className="bg-indigo-800 text-indigo-100 px-2 py-0.5 rounded text-sm whitespace-nowrap">
                ($ {Array.from(selectedChargeIds).reduce((sum, id) => {
                  const charge = selectedClient.transactions.find(tx => tx.id === id);
                  return sum + (charge ? charge.amount - getAppliedAmount(charge) : 0);
                }, 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})
              </span>
            </span>`
);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
