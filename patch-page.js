const fs = require('fs');

let page = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf-8');

page = page.replace(
  '<ImportAFIPModal \n        isOpen={isImportModalOpen} \n        onClose={() => setIsImportModalOpen(false)} \n        clientes={clientes}\n        onImportComplete={() => {\n          fetchData(); // Reload data after import\n        }}\n      />',
  '<ImportAFIPModal \n        isOpen={isImportModalOpen} \n        onClose={() => setIsImportModalOpen(false)} \n        clientes={clientes}\n        conceptos={billingConcepts}\n        onImportComplete={() => {\n          fetchData(); // Reload data after import\n        }}\n      />'
);

fs.writeFileSync('src/app/comprobantes/page.tsx', page);
