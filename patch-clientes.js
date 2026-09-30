const fs = require('fs');
let page = fs.readFileSync('src/app/clientes/page.tsx', 'utf8');

if (!page.includes('IS_CORI')) {
  page = page.replace(
    'export default function ClientesPage() {',
    'const IS_CORI = process.env.NEXT_PUBLIC_STUDIO_NAME === \'CORI\';\n\nexport default function ClientesPage() {'
  );
}

page = page.replace(
  '<option value="FEDE_RI">Fede RI (+21%)</option>\n                    <option value="JUANMA_MONO">JuanMa Mono</option>',
  '{!IS_CORI && <option value="FEDE_RI">Fede RI (+21%)</option>}\n                    <option value="JUANMA_MONO">{IS_CORI ? \'Monotributo\' : \'JuanMa Mono\'}</option>'
);

page = page.replace(
  '<option value="FEDE_RI">RI</option>\n                          <option value="JUANMA_MONO">Mono</option>',
  '{!IS_CORI && <option value="FEDE_RI">RI</option>}\n                          <option value="JUANMA_MONO">{IS_CORI ? \'Mono\' : \'Mono\'}</option>'
);

page = page.replace(
  "{c.defaultBillingProfile === 'FEDE_RI' ? 'Fede RI' : c.defaultBillingProfile === 'JUANMA_MONO' ? 'JuanMa Mono' : 'No Fiscal'}",
  "{c.defaultBillingProfile === 'FEDE_RI' ? 'Fede RI' : c.defaultBillingProfile === 'JUANMA_MONO' ? (IS_CORI ? 'Monotributo' : 'JuanMa Mono') : 'No Fiscal'}"
);

fs.writeFileSync('src/app/clientes/page.tsx', page);
