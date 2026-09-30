const fs = require('fs');
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

sidebar = sidebar.replace(
  "    ...(userRole === 'ADMIN' ? [\n      { name: 'Sueldos', path: '/sueldos', icon: Users },\n      { name: 'Configuración', path: '/configuracion', icon: Settings }\n    ] : []),",
  `    ...(userRole === 'ADMIN' ? [
      ...(process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' ? [] : [{ name: 'Sueldos', path: '/sueldos', icon: Users }]),
      { name: 'Configuración', path: '/configuracion', icon: Settings }
    ] : []),`
);

// Fallback for encoding
sidebar = sidebar.replace(
  "    ...(userRole === 'ADMIN' ? [\n      { name: 'Sueldos', path: '/sueldos', icon: Users },\n      { name: 'Configuracin', path: '/configuracion', icon: Settings }\n    ] : []),",
  `    ...(userRole === 'ADMIN' ? [
      ...(process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' ? [] : [{ name: 'Sueldos', path: '/sueldos', icon: Users }]),
      { name: 'Configuracin', path: '/configuracion', icon: Settings }
    ] : []),`
);

fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
