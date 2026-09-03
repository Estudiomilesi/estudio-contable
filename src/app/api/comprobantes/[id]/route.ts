import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Verificar si existe y si no ha sido enviado
    const tx = await prisma.accountTransaction.findUnique({
      where: { id }
    });

    if (!tx) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    if (tx.isEmailed) {
      return NextResponse.json({ error: 'No se puede eliminar un comprobante que ya fue enviado por email.' }, { status: 400 });
    }

    // Proteger los saldos iniciales (todo lo importado antes del 3 de Septiembre)
    const isHistorical = tx.createdAt < new Date('2026-09-03T00:00:00Z');
    if (isHistorical) {
      return NextResponse.json({ error: 'No se pueden eliminar los comprobantes cargados como saldos iniciales.' }, { status: 400 });
    }

    await prisma.accountTransaction.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando comprobante:", error);
    return NextResponse.json({ error: 'Error interno al eliminar el comprobante' }, { status: 500 });
  }
}
