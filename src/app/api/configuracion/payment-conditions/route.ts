import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const conditions = await prisma.paymentCondition.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });
    return NextResponse.json(conditions);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener condiciones de pago' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, isDefault } = data;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    if (isDefault) {
      // Remove default from others
      await prisma.paymentCondition.updateMany({
        data: { isDefault: false }
      });
    }

    const newCondition = await prisma.paymentCondition.create({
      data: { name, isDefault: isDefault || false, isActive: true },
    });

    return NextResponse.json(newCondition);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una condición de pago con este nombre' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear condición de pago' }, { status: 500 });
  }
}
