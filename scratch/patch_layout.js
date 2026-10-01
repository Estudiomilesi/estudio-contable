const fs = require('fs');
let c = fs.readFileSync('src/app/layout.tsx', 'utf8');

c = c.replace(
  "let userRole = 'COLLABORATOR';",
  "let userRole = 'COLLABORATOR';\n  let userEmail = '';"
);

c = c.replace(
  "userRole = payload.role as string;\n      }",
  "userRole = payload.role as string;\n      }\n      if (payload.email) {\n        userEmail = payload.email as string;\n      }"
);

c = c.replace(
  "<Sidebar userRole={userRole} />",
  "<Sidebar userRole={userRole} userEmail={userEmail} />"
);

fs.writeFileSync('src/app/layout.tsx', c);
