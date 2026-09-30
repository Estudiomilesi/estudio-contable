const fs = require('fs');
let content = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');

// We need to change:
// const nroMatch = text.match(/(?:Comp|Cbte)?[.\\s]*Nro[.\\s:]*(\\d{8})/i);
// to require Comp or Cbte, OR negative lookbehind brutos
// const nroMatch = text.match(/(?:Comp|Cbte|Comprobante)[.\\s]*Nro[.\\s:]*(\\d{8})/i) || text.match(/(?<!Brutos\\s*)(?<!Brutos\\s*Nro[.\\s:]*)Nro[.\\s:]*(\\d{8})/i);

const regexToReplace = /const nroMatch = text\.match\(\/\(\?:Comp\|Cbte\)\?\[\.\\\\s\]\*Nro\[\.\\\\s:\]\*\(\\\\\d\{8\}\)\/i\);/g;
const newRegex = "const nroMatch = text.match(/(?:Comp|Cbte|Comprobante)[.\\s]*Nro[.\\s:]*(\\d{8})/i) || text.match(/(?<!brutos[\\s\\S]{0,20})Nro[.\\s:]*(\\d{8})/i);";

content = content.replace(regexToReplace, newRegex);

fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', content);
console.log('Fixed nroMatch');
