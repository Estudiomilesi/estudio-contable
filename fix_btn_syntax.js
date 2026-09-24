const fs = require('fs');
let code = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf-8');

code = code.replace(
  "{isSubmittingApply ? 'Procesando...' : (selectedChargeIds.size > 0 ? 'Aplicar a Seleccionados' : 'Confirmar Aplicación'}",
  "{isSubmittingApply ? 'Procesando...' : (selectedChargeIds.size > 0 ? 'Aplicar a Seleccionados' : 'Confirmar Aplicación')}"
);

// I must also add disabled={isSubmittingApply} to the button! It was missing in my previous replace.
const btnTarget = `<button 
                    type="submit"
                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >`;
const btnNew = `<button 
                    type="submit"
                    disabled={isSubmittingApply}
                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >`;
code = code.replace(btnTarget, btnNew);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', code);
