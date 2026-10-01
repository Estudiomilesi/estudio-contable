const fs = require('fs');
let c = fs.readFileSync('src/middleware.ts', 'utf8');

const injection = `
    if (payload.email === 'luisina@estudiomilesi.com') {
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
    }
`;

// Insert the injection after verify token
c = c.replace(
  "const { payload } = await jwtVerify(token, JWT_SECRET);",
  "const { payload } = await jwtVerify(token, JWT_SECRET);" + injection
);

// We need to double check login redirection too
c = c.replace(
  "if (isLoginPage) {\n      return NextResponse.redirect(new URL('/', request.url));\n    }",
  "if (isLoginPage) {\n      if (payload.email === 'luisina@estudiomilesi.com') return NextResponse.redirect(new URL('/cuentas-corrientes', request.url));\n      return NextResponse.redirect(new URL('/', request.url));\n    }"
);

fs.writeFileSync('src/middleware.ts', c);
