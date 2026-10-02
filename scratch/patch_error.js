const fs = require('fs');
let c = fs.readFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', 'utf8');

c = c.replace(
  "return NextResponse.json({ error: 'Error interno al registrar el cobro' }, { status: 500 });",
  "return NextResponse.json({ error: 'Error interno al registrar el cobro: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });"
);

fs.writeFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', c);
