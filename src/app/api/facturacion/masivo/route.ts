import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { updates } = data; // Array of { id: string, currentFee: number }

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    // Ejecutar todas las actualizaciones en una transacción
    await prisma.$transaction(
      updates.map(u => 
        prisma.client.update({
          where: { id: u.id },
          data: { currentFee: parseFloat(u.currentFee) }
        })
      )
    );

    return NextResponse.json({ message: 'Abonos actualizados correctamente' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar abonos' }, { status: 500 });
  }
}
