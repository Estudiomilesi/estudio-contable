const fs = require('fs');

let page = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

// 1. Fix toggleAll
page = page.replace(
  `  const toggleAll = () => {
    if (selectedIds.size === clientes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clientes.map(c => c.id)));
    }
  };`,
  `  const toggleAll = () => {
    if (selectedIds.size === filteredAndSortedClientes.length && filteredAndSortedClientes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedClientes.map(c => c.id)));
    }
  };`
);

// 2. Fix checkbox logic in the table head
page = page.replace(
  `checked={clientes.length > 0 && selectedIds.size === clientes.length}`,
  `checked={filteredAndSortedClientes.length > 0 && selectedIds.size === filteredAndSortedClientes.length}`
);

// 3. Fix ejecutarProcesoMensual target
page = page.replace(
  `const targetClients = selectedIds.size > 0 ? Array.from(selectedIds) : clientes.map(c => c.id);`,
  `const targetClients = selectedIds.size > 0 ? Array.from(selectedIds) : filteredAndSortedClientes.map(c => c.id);`
);

fs.writeFileSync('src/app/facturacion/page.tsx', page);
console.log('Facturacion patched to respect filters');
