const fs = require('fs');
let c = fs.readFileSync('src/middleware.ts', 'utf8');

const middlewareLogic = `    if (request.nextUrl.pathname.startsWith('/sueldos') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (payload.email === 'luisina@estudiomilesi.com') {
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
    }
`;

c = c.replace(`    if (request.nextUrl.pathname.startsWith('/sueldos') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }`, middlewareLogic);

fs.writeFileSync('src/middleware.ts', c);
