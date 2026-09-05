import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const isJuanma = request.headers.get('x-is-juanma') === 'true';
    const whereClause: any = { isActive: true, hasAbono: true };
    if (isJuanma) {
      whereClause.professionalLabel = { in: ['FJ', 'JF'] };
    }

    const clientes = await prisma.client.findMany({
      where: whereClause,
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
