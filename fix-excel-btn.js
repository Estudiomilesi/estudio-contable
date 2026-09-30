const fs = require('fs');

let page = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

const anchorRegex = /<button\s+onClick=\{guardarCambiosMasivos\}/;

if (page.match(anchorRegex) && !page.includes('handleExportarExcel}')) {
    page = page.replace(
        anchorRegex,
        `<button 
              onClick={handleExportarExcel} 
              className="rounded-md bg-green-600 py-1.5 px-3 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center gap-1"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button onClick={guardarCambiosMasivos}`
    );
    fs.writeFileSync('src/app/facturacion/page.tsx', page);
    console.log('Successfully patched button');
} else if (page.includes('handleExportarExcel}')) {
    console.log('Button already exists');
} else {
    console.log('Anchor not found');
}
