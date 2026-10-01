const fs = require('fs');
let c = fs.readFileSync('src/middleware.ts', 'utf8');

c = c.replace(`    if (payload.email === 'luisina@estudiomilesi.com') {
      const path = request.nextUrl.pathname;
      if (
        path.startsWith('/clientes') || 
        path.startsWith('/comprobantes') || 
        path.startsWith('/reportes') || 
        path.startsWith('/configuracion') || 
        path.startsWith('/sueldos')
      ) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }`, `    if (payload.email === 'luisina@estudiomilesi.com') {
      const path = request.nextUrl.pathname;
      if (
        path === '/' ||
        path.startsWith('/clientes') || 
        path.startsWith('/comprobantes') || 
        path.startsWith('/reportes') || 
        path.startsWith('/configuracion') || 
        path.startsWith('/sueldos')
      ) {
        return NextResponse.redirect(new URL('/cuentas-corrientes', request.url));
      }
    }`);

c = c.replace(
  "if (request.nextUrl.pathname.startsWith('/sueldos') && payload.role !== 'ADMIN') {\n      return NextResponse.redirect(new URL('/', request.url));\n    }",
  "if (request.nextUrl.pathname.startsWith('/sueldos') && payload.role !== 'ADMIN') {\n      return NextResponse.redirect(new URL('/cuentas-corrientes', request.url));\n    }"
);

// We need to double check login redirection too
c = c.replace(
  "if (isLoginPage) {\n      return NextResponse.redirect(new URL('/', request.url));\n    }",
  "if (isLoginPage) {\n      if (payload.email === 'luisina@estudiomilesi.com') return NextResponse.redirect(new URL('/cuentas-corrientes', request.url));\n      return NextResponse.redirect(new URL('/', request.url));\n    }"
);

fs.writeFileSync('src/middleware.ts', c);
