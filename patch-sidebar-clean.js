const fs = require('fs');
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const regex = /\.\.\.\(userRole === 'ADMIN' \? \[\r?\n\s*\{ name: 'Sueldos', path: '\/sueldos', icon: Users \},\r?\n\s*\{ name: 'Configuraci[^']+', path: '\/configuracion', icon: Settings \}\r?\n\s*\] : \[\]\),/g;

sidebar = sidebar.replace(regex, `...(userRole === 'ADMIN' ? [
      ...(process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' ? [] : [{ name: 'Sueldos', path: '/sueldos', icon: Users }]),
      { name: 'Configuración', path: '/configuracion', icon: Settings }
    ] : []),`);

fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
