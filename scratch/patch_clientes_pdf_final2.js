const fs = require('fs');
let c = fs.readFileSync('src/app/clientes/page.tsx', 'utf8');

c = c.replace(
  '<label htmlFor="hasAbono" className="text-sm font-medium text-gray-700">Incluir en Abono Mensual</label>',
  `<label htmlFor="hasAbono" className="text-sm font-medium text-gray-700">Incluir en Abono Mensual</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="wantsPdfAttachment" checked={formData.wantsPdfAttachment} onChange={e => setFormData({...formData, wantsPdfAttachment: e.target.checked})} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="wantsPdfAttachment" className="text-sm font-medium text-gray-700">Adjuntar PDF de Abono</label>`
);

fs.writeFileSync('src/app/clientes/page.tsx', c);
