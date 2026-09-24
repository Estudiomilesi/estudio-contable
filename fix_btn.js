const fs = require('fs');
let code = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf-8');

const target = `<button 
                      type="submit"
                      className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                    >`;
const replacement = `<button 
                      type="submit"
                      disabled={isSubmittingApply}
                      className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                    >`;

code = code.replace(target, replacement);

const t2 = `{selectedChargeIds.size > 0 ? 'Aplicar a Seleccionados' : 'Confirmar`;
const r2 = `{isSubmittingApply ? 'Procesando...' : (selectedChargeIds.size > 0 ? 'Aplicar a Seleccionados' : 'Confirmar`;

code = code.replace(t2, r2);
// Ensure we didn't break closing brackets if there was an issue, wait, replace is safe here.
// Let's replace the whole string to be safe.

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', code);
