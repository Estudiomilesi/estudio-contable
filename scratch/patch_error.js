const fs = require('fs');
let c = fs.readFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', 'utf8');
c = c.replace(/return NextResponse\.json\(\{ error: 'Error interno' \}, \{ status: 500 \}\);/, "return NextResponse.json({ error: String(error) }, { status: 500 });");
fs.writeFileSync('src/app/api/cuentas-corrientes/enviar-recibo/route.ts', c);
