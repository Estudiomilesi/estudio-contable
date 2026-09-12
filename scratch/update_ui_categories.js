const fs = require('fs');
let page = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf-8');
page = page.replace(
  "editingTx.category === 'Sueldos' || editingTx.category === 'Participacion'",
  "editingTx.category === 'Sueldos' || editingTx.category?.includes('Participacion') || editingTx.category?.includes('Participación')"
);
page = page.replace(
  "formData.category === 'Sueldos' || formData.category === 'Participacion'",
  "formData.category === 'Sueldos' || formData.category?.includes('Participacion') || formData.category?.includes('Participación')"
);
fs.writeFileSync('src/app/tesoreria/page.tsx', page);

let route = fs.readFileSync('src/app/api/tesoreria/route.ts', 'utf-8');
route = route.replace(
  "(t.category === 'Sueldos' || t.category === 'Participacion')",
  "(t.category === 'Sueldos' || t.category?.includes('Participacion') || t.category?.includes('Participación'))"
);
fs.writeFileSync('src/app/api/tesoreria/route.ts', route);
