import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const description = data.description || 'Abono Mensual';
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Obtener todos los clientes con abono mayor a 0
    const clientes = await prisma.client.findMany({
      where: { currentFee: { gt: 0 } }
    });

    // Validar si ya se facturó este mes? Opcional. 
    // Para simplificar, insertamos los cargos.
    const transacciones = clientes.map(cliente => ({
      clientId: cliente.id,
      type: 'CHARGE' as const,
      amount: cliente.currentFee,
      description: `${description} - ${currentMonth}`
    }));

    await prisma.accountTransaction.createMany({
      data: transacciones
    });

    return NextResponse.json({ message: `Se facturó exitosamente a ${transacciones.length} clientes.` }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error al procesar facturación masiva' }, { status: 500 });
  }
}
