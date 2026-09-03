import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const existingCliente = await prisma.client.findUnique({ where: { id } });
    if (!existingCliente) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updatedCliente = await prisma.client.update({
      where: { id },
      data: {
        code: data.code ?? existingCliente.code,
        name: data.name ?? existingCliente.name,
        address: data.address !== undefined ? data.address : existingCliente.address,
        cuit: data.cuit !== undefined ? data.cuit : existingCliente.cuit,
        email: data.email ?? existingCliente.email,
        cellphone: data.cellphone !== undefined ? data.cellphone : existingCliente.cellphone,
        contact: data.contact !== undefined ? data.contact : existingCliente.contact,
        fiscalCondition: data.fiscalCondition !== undefined ? data.fiscalCondition : existingCliente.fiscalCondition,
        professionalLabel: data.professionalLabel ?? existingCliente.professionalLabel,
        currentFee: data.currentFee !== undefined ? parseFloat(data.currentFee) : existingCliente.currentFee,
        isActive: data.isActive !== undefined ? data.isActive : existingCliente.isActive,
        hasAbono: data.hasAbono !== undefined ? data.hasAbono : existingCliente.hasAbono,
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
