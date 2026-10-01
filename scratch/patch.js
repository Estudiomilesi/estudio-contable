const fs = require('fs'); 
let c = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf8'); 
c = c.replace('<label className="block text-xs font-medium text-gray-700">Número</label>', '<div className="flex justify-between items-center"><label className="block text-xs font-medium text-gray-700">Número</label><label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={check.isEcheq} onChange={e => { const newChecks = [...incomingChecks]; newChecks[index].isEcheq = e.target.checked; setIncomingChecks(newChecks); }} className="rounded border-gray-300 text-indigo-600" /><span className="text-[10px] font-bold text-blue-800">Echeq</span></label></div>'); 
fs.writeFileSync('src/app/tesoreria/page.tsx', c);
