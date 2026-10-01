const fs = require('fs');
let c = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const target = `  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Abonos', path: '/facturacion', icon: FileText },
    { name: 'Comprobantes', path: '/comprobantes', icon: FileText },
    { name: 'Cuentas Corrientes', path: '/cuentas-corrientes', icon: UserCheck },
    { name: 'Tesorería', path: '/tesoreria', icon: Wallet },
    ...(userRole === 'ADMIN' ? [
      ...(process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' ? [] : [{ name: 'Sueldos', path: '/sueldos', icon: Users }]),
      { name: 'Configuración', path: '/configuracion', icon: Settings }
    ] : []),
    { name: 'Reportes', path: '/reportes', icon: BarChart3 },
  ];`;

const newLogic = `  let menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Abonos', path: '/facturacion', icon: FileText },
    { name: 'Comprobantes', path: '/comprobantes', icon: FileText },
    { name: 'Cuentas Corrientes', path: '/cuentas-corrientes', icon: UserCheck },
    { name: 'Tesorería', path: '/tesoreria', icon: Wallet },
    ...(userRole === 'ADMIN' ? [
      ...(process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' ? [] : [{ name: 'Sueldos', path: '/sueldos', icon: Users }]),
      { name: 'Configuración', path: '/configuracion', icon: Settings }
    ] : []),
    { name: 'Reportes', path: '/reportes', icon: BarChart3 },
  ];

  if (userEmail === 'luisina@estudiomilesi.com') {
    const allowed = ['Abonos', 'Cuentas Corrientes', 'Tesorería'];
    menuItems = menuItems.filter(m => allowed.includes(m.name));
  }`;

c = c.replace(target, newLogic);
fs.writeFileSync('src/components/Sidebar.tsx', c);
