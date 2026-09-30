const fs = require('fs');
let route = fs.readFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', 'utf8');

route = route.replace(
  'export async function POST(\n  request: Request,\n  { params }: { params: { id: string } }\n) {',
  'export async function POST(\n  request: Request,\n  { params }: { params: Promise<{ id: string }> }\n) {'
);

route = route.replace(
  'const transactionId = params.id;',
  'const p = await params;\n    const transactionId = p.id;'
);

fs.writeFileSync('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts', route);
