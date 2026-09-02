import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT777tNKJXA-ZtxvNdasJdFcPuszmMr71ZmMv8yonPUb6vwJoYwiO_-4VQ-2ZILxhVszVdPlW5SxfQK/pub?gid=1119670544&single=true&output=csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    const lines = csvText.split('\n');
    let imported = 0;
    
    // Header is on line 10 (index 9) based on the file inspection
    // But let's just find the line that starts with "ESTUDIO,Codigo,Cliente"
    const headerIndex = lines.findIndex(l => l.startsWith('ESTUDIO,Codigo,Cliente'));
    if (headerIndex === -1) {
      return NextResponse.json({ error: 'No se encontró el encabezado' }, { status: 400 });
    }

    const rows = lines.slice(headerIndex + 1);

    for (const row of rows) {
      if (!row.trim()) continue;
      
      const cols = row.split(',').map(c => c.trim().replace(/"/g, ''));
      if (cols.length < 3) continue;

      let estudio = cols[0].toUpperCase();
      let codigo = cols[1];
      let nombre = cols[2];

      if (!nombre) continue;

      // Clean up inputs
      if (estudio === 'JJ') estudio = 'JF';
      if (!['F', 'FJ', 'JF'].includes(estudio)) estudio = 'F'; // Default if missing or weird

      if (!codigo) {
        codigo = 'S/C-' + Math.floor(Math.random() * 10000); // Sin código
      }

      // Find the last non-empty fee column
      // We know dates end right before FACTURAR A, ENVIAR A which are the last two cols if they exist.
      // Actually, let's just find the last column that looks like a number.
      let currentFee = 0;
      for (let i = cols.length - 1; i >= 3; i--) {
        const val = cols[i].replace(/\./g, '').replace(/,/g, '.').replace('-', '').trim();
        if (val && !isNaN(parseFloat(val))) {
          currentFee = parseFloat(val);
          break;
        }
      }

      // Upsert client
      await prisma.client.upsert({
        where: { code: codigo },
        update: {
          name: nombre,
          professionalLabel: estudio as 'F' | 'FJ' | 'JF',
          currentFee: currentFee,
        },
        create: {
          code: codigo,
          name: nombre,
          email: 'falta@email.com', // Placeholder since it's required
          professionalLabel: estudio as 'F' | 'FJ' | 'JF',
          currentFee: currentFee,
        }
      });
      imported++;
    }

    return NextResponse.json({ message: `Importación completada. Se procesaron ${imported} clientes.` });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
