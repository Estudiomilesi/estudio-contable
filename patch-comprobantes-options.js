const fs = require('fs');
let page = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');

page = page.replace(
  /<option value="FEDE_RI">Federico - Responsable Inscripto<\/option>\r?\n\s*<option value="JUANMA_MONO">Juan Manuel - Monotributo<\/option>/,
  "{!IS_CORI && <option value=\"FEDE_RI\">Federico - Responsable Inscripto</option>}\n                <option value=\"JUANMA_MONO\">{IS_CORI ? 'Monotributo' : 'Juan Manuel - Monotributo'}</option>"
);

page = page.replace(
  /\{c\.billingProfile === 'FEDE_RI' && <span className="bg-blue-100 text-blue-800 px-1\.5 py-0\.5 rounded">F RI<\/span>\}\r?\n\s*\{c\.billingProfile === 'JUANMA_MONO' && <span className="bg-purple-100 text-purple-800 px-1\.5 py-0\.5 rounded">J Mono<\/span>\}/,
  "{c.billingProfile === 'FEDE_RI' && <span className=\"bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded\">F RI</span>}\n                      {c.billingProfile === 'JUANMA_MONO' && <span className=\"bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded\">{IS_CORI ? 'Mono' : 'J Mono'}</span>}"
);

fs.writeFileSync('src/app/comprobantes/page.tsx', page);
