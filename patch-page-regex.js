const fs = require('fs');
let page = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf-8');

page = page.replace(
  /<ImportAFIPModal[\s\S]*?onImportComplete=\{[^}]+\}\n\s*\/>/,
  `<ImportAFIPModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        clientes={clientes}
        conceptos={billingConcepts}
        onImportComplete={() => {
          fetchData(); // Reload data after import
        }}
      />`
);

fs.writeFileSync('src/app/comprobantes/page.tsx', page);
