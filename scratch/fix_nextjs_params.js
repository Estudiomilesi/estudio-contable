const fs = require('fs');

// Fix API Route Promises for Next.js 16+
let r = fs.readFileSync('src/app/api/clientes/[id]/notes/route.ts', 'utf8');
r = r.replace(
  'export async function GET(request: Request, { params }: { params: { id: string } }) {',
  'export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {'
);
r = r.replace(
  'const notes = await prisma.clientNote.findMany({',
  'const resolvedParams = await params;\n    const notes = await prisma.clientNote.findMany({'
);
r = r.replace(
  'where: { clientId: params.id },',
  'where: { clientId: resolvedParams.id },'
);

r = r.replace(
  'export async function POST(request: Request, { params }: { params: { id: string } }) {',
  'export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {'
);
r = r.replace(
  'const { content } = await request.json();',
  'const { content } = await request.json();\n    const resolvedParams = await params;'
);
r = r.replace(
  'clientId: params.id,',
  'clientId: resolvedParams.id,'
);

fs.writeFileSync('src/app/api/clientes/[id]/notes/route.ts', r);


// Add missing import
let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');
if (!c.includes("import ClientNotesModal")) {
  c = "import ClientNotesModal from '@/components/ClientNotesModal';\n" + c;
}
fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
