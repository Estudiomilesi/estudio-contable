const fs = require('fs');

let c = fs.readFileSync('src/app/clientes/page.tsx', 'utf8');

c = c.replace(
  /  hasAbono: true,\n  assignedCollaborator: '',/,
  `  hasAbono: true,\n  wantsPdfAttachment: false,\n  assignedCollaborator: '',`
);

c = c.replace(
  /      hasAbono: c.hasAbono,\n      assignedCollaborator: c.assignedCollaborator \|\| '',/,
  `      hasAbono: c.hasAbono,\n      wantsPdfAttachment: c.wantsPdfAttachment ?? false,\n      assignedCollaborator: c.assignedCollaborator || '',`
);

c = c.replace(
  /                <label htmlFor="hasAbono" className="text-sm font-medium text-gray-700">Incluir en Abono Mensual<\/label>\n              <\/div>/,
  `                <label htmlFor="hasAbono" className="text-sm font-medium text-gray-700">Incluir en Abono Mensual</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="wantsPdfAttachment" checked={formData.wantsPdfAttachment} onChange={e => setFormData({...formData, wantsPdfAttachment: e.target.checked})} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="wantsPdfAttachment" className="text-sm font-medium text-gray-700">Adjuntar PDF de Abono</label>
              </div>`
);

fs.writeFileSync('src/app/clientes/page.tsx', c);
