const fs = require('fs');
let c = fs.readFileSync('src/app/clientes/page.tsx', 'utf8');

c = c.replace(
  "      hasAbono: c.hasAbono,\r\n      assignedCollaborator: c.assignedCollaborator || '',",
  "      hasAbono: c.hasAbono,\r\n      wantsPdfAttachment: c.wantsPdfAttachment ?? false,\r\n      assignedCollaborator: c.assignedCollaborator || '',"
);

c = c.replace(
  "      hasAbono: c.hasAbono,\n      assignedCollaborator: c.assignedCollaborator || '',",
  "      hasAbono: c.hasAbono,\n      wantsPdfAttachment: c.wantsPdfAttachment ?? false,\n      assignedCollaborator: c.assignedCollaborator || '',"
);

fs.writeFileSync('src/app/clientes/page.tsx', c);
