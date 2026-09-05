import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const isJuanma = request.headers.get('x-is-juanma') === 'true';
    const whereClause: any = isJuanma ? { professionalLabel: { in: ['FJ', 'JF'] } } : {};

    const clientes = await prisma.client.findMany({
      where: whereClause,
      orderBy: { code: 'asc' },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // basic validation
    if (!data.code || !data.name || !data.email) {
      return NextResponse.json({ error: 'Código, Nombre y Email son obligatorios' }, { status: 400 });
    }

    const nuevoCliente = await prisma.client.create({
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
        defaultBillingProfile: data.defaultBillingProfile || 'NO_FISCAL',
        currentFee: parseFloat(data.currentFee || 0),
        hasAbono: data.hasAbono ?? true,
      },
    });

    return NextResponse.json(nuevoCliente, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 });
  }
}
