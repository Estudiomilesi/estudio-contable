const fs = require('fs');

let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

if (!c.includes('MessageSquare')) {
  c = c.replace(
    "import { FileSpreadsheet, FileText, Send } from 'lucide-react';",
    "import { FileSpreadsheet, FileText, Send, MessageSquare } from 'lucide-react';"
  );
}

c = c.replace(
  `<button onClick={exportClientExcel} title="Descargar en Excel" className="hover:text-green-600 transition-colors"><FileSpreadsheet size={20} /></button>`,
  `<button onClick={() => setIsNotesModalOpen(true)} title="Seguimiento (Notas)" className="hover:text-blue-600 transition-colors"><MessageSquare size={20} /></button>\n                  <button onClick={exportClientExcel} title="Descargar en Excel" className="hover:text-green-600 transition-colors"><FileSpreadsheet size={20} /></button>`
);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
