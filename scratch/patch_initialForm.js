const fs = require('fs');
let c = fs.readFileSync('src/app/clientes/page.tsx', 'utf8');
c = c.replace(
  "  hasAbono: true,\r\n  assignedCollaborator: '',",
  "  hasAbono: true,\r\n  wantsPdfAttachment: false,\r\n  assignedCollaborator: '',"
);
fs.writeFileSync('src/app/clientes/page.tsx', c);
