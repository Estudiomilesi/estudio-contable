import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updatedCliente = await prisma.client.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        address: data.address || null,
        cuit: data.cuit || null,
        email: data.email,
        cellphone: data.cellphone || null,
        contact: data.contact || null,
        fiscalCondition: data.fiscalCondition || null,
        professionalLabel: data.professionalLabel,
        currentFee: parseFloat(data.currentFee || 0),
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return NextResponse.json(updatedCliente, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verificar si tiene movimientos en cuenta corriente
    const accountTransactions = await prisma.accountTransaction.count({
      where: { clientId: id }
    });

    if (accountTransactions > 0) {
      return NextResponse.json({ error: 'No se puede eliminar el cliente porque tiene movimientos en su cuenta corriente. Puede desactivarlo en su lugar.' }, { status: 400 });
    }

    await prisma.client.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Cliente eliminado correctamente' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar el cliente' }, { status: 500 });
  }
}
