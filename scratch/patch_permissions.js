const fs = require('fs');

// Fix Sidebar
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  "const allowed = ['Abonos', 'Cuentas Corrientes', 'Tesorería'];",
  "const allowed = ['Comprobantes', 'Cuentas Corrientes', 'Tesorería'];"
);
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);

// Fix middleware
let middleware = fs.readFileSync('src/middleware.ts', 'utf8');
middleware = middleware.replace(
  "path.startsWith('/comprobantes') ||",
  "path.startsWith('/facturacion') ||"
);
fs.writeFileSync('src/middleware.ts', middleware);
