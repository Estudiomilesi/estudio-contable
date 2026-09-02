import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clientes = await prisma.client.findMany({
      where: { isActive: true },
      include: {
        accountTransactions: {
          where: { type: 'CHARGE' },
          orderBy: { date: 'desc' },
          take: 12
        }
      },
      orderBy: { code: 'asc' },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
