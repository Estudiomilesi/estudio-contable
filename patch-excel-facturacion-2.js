const fs = require('fs');

let page = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

if (!page.includes("import * as XLSX from 'xlsx';")) {
  page = page.replace(
    "import { Trash2 } from 'lucide-react';",
    "import { Trash2, FileSpreadsheet } from 'lucide-react';\nimport * as XLSX from 'xlsx';"
  );
}

const exportFunc = `
  const handleExportarExcel = () => {
    const data = filteredAndSortedClientes.map(c => ({
      'Código': c.code,
      'Cliente': c.name,
      'Perfil Fac.': billingProfileEdiciones[c.id] || c.defaultBillingProfile,
      'Abono Neto': ediciones[c.id] !== undefined ? ediciones[c.id] : c.currentFee
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Abonos");
    
    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, r['Cliente'].length), 10);
    ws['!cols'] = [ {wch: 10}, {wch: max_width}, {wch: 20}, {wch: 15} ];

    XLSX.writeFile(wb, \`Planilla_Abonos_\${new Date().toISOString().split('T')[0]}.xlsx\`);
  };

  const requestSort = (key: keyof Client) => {`;

page = page.replace('const requestSort = (key: keyof Client) => {', exportFunc);

const exportButton = `
            <button 
              onClick={handleExportarExcel} 
              className="rounded-md bg-green-600 py-1.5 px-3 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center gap-1"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            
            <button 
              onClick={guardarCambiosMasivos} `;

page = page.replace(
  '<button \n              onClick={guardarCambiosMasivos} ',
  exportButton
);
// In case the spacing is different:
page = page.replace(
  '<button \r\n              onClick={guardarCambiosMasivos} ',
  exportButton
);

fs.writeFileSync('src/app/facturacion/page.tsx', page);
console.log('Patched');
