const fs = require('fs');

let cc = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');
cc = cc.replace("import ClientNotesModal from '@/components/ClientNotesModal';\n\"use client\";", "\"use client\";\nimport ClientNotesModal from '@/components/ClientNotesModal';");
fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', cc);

let modal = fs.readFileSync('src/components/ClientNotesModal.tsx', 'utf8');
if (!modal.includes('"use client"')) {
  modal = '"use client";\n' + modal;
  fs.writeFileSync('src/components/ClientNotesModal.tsx', modal);
}
