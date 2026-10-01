const fs = require('fs');
let c = fs.readFileSync('src/app/sueldos/SueldosClient.tsx', 'utf8');

c = c.replace(
  '<option value="CAJA">Caja</option>',
  '<option value="CAJA">Caja</option>\n                      <option value="CAJA IVA">Caja IVA</option>'
);

fs.writeFileSync('src/app/sueldos/SueldosClient.tsx', c);
