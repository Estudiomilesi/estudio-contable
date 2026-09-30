const fs = require('fs');

let page = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

const t2 = `  const toggleAll = () => {
    if (selectedIds.size === clientes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clientes.map(c => c.id)));
    }
  };`;

page = page.replace(/const toggleAll = \(\) => \{[\s\S]*?\};/m, `const toggleAll = () => {
    if (selectedIds.size === filteredAndSortedClientes.length && filteredAndSortedClientes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedClientes.map(c => c.id)));
    }
  };`);

fs.writeFileSync('src/app/facturacion/page.tsx', page);
console.log('Facturacion toggleAll patched');
