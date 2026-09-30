const fs = require('fs');
let content = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');

const regexToReplace = /    const fileNameMatch = file\.name\.match\(\/\^\(\\\\d\{11\}\)_\\\\d\{2,3\}_\(\\\\d\{4,5\}\)_\(\\\\d\{8\}\)\\\\.pdf\$\/i\);\r?\n    if \(fileNameMatch\) \{\r?\n      pv = fileNameMatch\[2\];\r?\n      nro = fileNameMatch\[3\];\r?\n    \} else \{/i;

content = content.replace(
  "const fileNameMatch = file.name.match(/^(\\d{11})_\\d{2,3}_(\\d{4,5})_(\\d{8})\\.pdf$/i);\n    if (fileNameMatch) {\n      pv = fileNameMatch[2];\n      nro = fileNameMatch[3];\n    } else {\n",
  ""
);
// Also need to remove the closing brace for the else block!
content = content.replace(
  "        if (pvMatch && nroMatch) {\n          pv = pvMatch[1].padStart(4, '0');\n          nro = nroMatch[1];\n        }\n      }\n    }",
  "        if (pvMatch && nroMatch) {\n          pv = pvMatch[1].padStart(4, '0');\n          nro = nroMatch[1];\n        }\n      }\n"
);

fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', content);
console.log('Removed fileNameMatch');
