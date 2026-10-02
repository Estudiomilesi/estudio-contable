const fs = require('fs');

let c = fs.readFileSync('src/app/clientes/page.tsx', 'utf8');

c = c.replace(
  /  hasAbono: boolean;/,
  `  hasAbono: boolean;\n  wantsPdfAttachment: boolean;`
);

c = c.replace(
  /  hasAbono: true,\n  assignedCollaborator: '',/,
  `  hasAbono: true,\n  wantsPdfAttachment: false,\n  assignedCollaborator: '',`
);

c = c.replace(
  /      hasAbono: c.hasAbono,\n      assignedCollaborator: c.assignedCollaborator \|\| '',/,
  `      hasAbono: c.hasAbono,\n      wantsPdfAttachment: c.wantsPdfAttachment,\n      assignedCollaborator: c.assignedCollaborator || '',`
);

const newCheckbox = `
              <div className="flex items-center mt-2">
                <input type="checkbox" id="wantsPdfAttachment" checked={formData.wantsPdfAttachment} onChange={e => setFormData({...formData, wantsPdfAttachment: e.target.checked})} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="wantsPdfAttachment" className="ml-2 text-sm font-medium text-gray-700">Adjuntar PDF en envíos masivos</label>
              </div>`;

c = c.replace(
  /                <label htmlFor="hasAbono" className="text-sm font-medium text-gray-700">Incluir en Abono Mensual<\/label>\n              <\/div>/,
  `                <label htmlFor="hasAbono" className="ml-2 text-sm font-medium text-gray-700">Incluir en Abono Mensual</label>\n              </div>${newCheckbox}`
);

fs.writeFileSync('src/app/clientes/page.tsx', c);
