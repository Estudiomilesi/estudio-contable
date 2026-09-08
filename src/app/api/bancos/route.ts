import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bancos = await prisma.bankAccount.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(bancos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener bancos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, cbu, cvu, alias, owner, isFedeRIDefault, isJuanmaMonoDefault } = data;
    
    if (!name || !owner) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Reset defaults if needed
    if (isFedeRIDefault) {
      await prisma.bankAccount.updateMany({
        where: { isFedeRIDefault: true },
        data: { isFedeRIDefault: false }
      });
    }
    if (isJuanmaMonoDefault) {
      await prisma.bankAccount.updateMany({
        where: { isJuanmaMonoDefault: true },
        data: { isJuanmaMonoDefault: false }
      });
    }

    const banco = await prisma.bankAccount.create({
      data: { name, cbu, cvu, alias, owner, isFedeRIDefault, isJuanmaMonoDefault }
    });
    return NextResponse.json(banco, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear banco' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name, cbu, cvu, alias, owner, isFedeRIDefault, isJuanmaMonoDefault, isActive } = data;

    // Reset defaults if needed
    if (isFedeRIDefault) {
      await prisma.bankAccount.updateMany({
        where: { isFedeRIDefault: true, id: { not: id } },
        data: { isFedeRIDefault: false }
      });
    }
    if (isJuanmaMonoDefault) {
      await prisma.bankAccount.updateMany({
        where: { isJuanmaMonoDefault: true, id: { not: id } },
        data: { isJuanmaMonoDefault: false }
      });
    }

    const banco = await prisma.bankAccount.update({
      where: { id },
      data: { name, cbu, cvu, alias, owner, isFedeRIDefault, isJuanmaMonoDefault, isActive }
    });
    return NextResponse.json(banco);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar banco' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;

    // Check if any client is using it
    const clientsCount = await prisma.client.count({
      where: { defaultBankAccountId: id }
    });

    if (clientsCount > 0) {
      return NextResponse.json({ error: 'No se puede eliminar porque hay clientes usando esta cuenta' }, { status: 400 });
    }

    await prisma.bankAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar banco' }, { status: 500 });
  }
}
