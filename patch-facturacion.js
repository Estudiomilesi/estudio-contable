const fs = require('fs');
let page = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

page = page.replace(
  /<option value="FEDE_RI">RI<\/option>\r?\n\s*<option value="JUANMA_MONO">Mono<\/option>/,
  "{!IS_CORI && <option value=\"FEDE_RI\">RI</option>}\n                      <option value=\"JUANMA_MONO\">{IS_CORI ? 'Mono' : 'Mono'}</option>"
);

page = page.replace(
  /<option value="FEDE_RI">Fede RI \(\+21\%\)<\/option>\r?\n\s*<option value="JUANMA_MONO">JuanMa Mono<\/option>/,
  "{!IS_CORI && <option value=\"FEDE_RI\">Fede RI (+21%)</option>}\n                          <option value=\"JUANMA_MONO\">{IS_CORI ? 'Monotributo' : 'JuanMa Mono'}</option>"
);

fs.writeFileSync('src/app/facturacion/page.tsx', page);
