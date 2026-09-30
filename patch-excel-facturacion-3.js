const fs = require('fs');

let page = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

const anchor = `            <button 
              onClick={guardarCambiosMasivos}`;

const replacement = `            <button 
              onClick={handleExportarExcel} 
              className="rounded-md bg-green-600 py-1.5 px-3 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center gap-1"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            
            <button 
              onClick={guardarCambiosMasivos}`;

page = page.split(anchor).join(replacement);

fs.writeFileSync('src/app/facturacion/page.tsx', page);
console.log('Button Patched');
