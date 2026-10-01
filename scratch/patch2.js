const fs = require('fs'); 
let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8'); 
c = c.replace('<label className="block text-xs font-bold text-gray-700">Número</label>', '<div className="flex justify-between items-center"><label className="block text-xs font-bold text-gray-700">Número</label><label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={qcCheckDetails.isEcheq} onChange={e => setQcCheckDetails({...qcCheckDetails, isEcheq: e.target.checked})} className="rounded border-gray-300 text-indigo-600" /><span className="text-[10px] font-bold text-blue-800">Echeq</span></label></div>'); 
fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
