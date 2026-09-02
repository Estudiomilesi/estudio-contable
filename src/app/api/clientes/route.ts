import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clientes = await prisma.client.findMany({
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
        professionalLabel: data.professionalLabel,
        currentFee: parseFloat(data.currentFee || 0),
      },
    });

    return NextResponse.json(nuevoCliente, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 });
  }
}
