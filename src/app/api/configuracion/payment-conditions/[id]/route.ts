import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: any) {
  const params = await context.params;
  const { id } = params;
  
  try {
    const data = await request.json();
    const { name, isActive, isDefault } = data;

    if (isDefault) {
      await prisma.paymentCondition.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.paymentCondition.update({
      where: { id },
      data: { name, isActive, isDefault },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const { id } = params;
  try {
    await prisma.paymentCondition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'No se puede eliminar porque está en uso' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
