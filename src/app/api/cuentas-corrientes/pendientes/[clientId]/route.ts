import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params;
    const charges = await prisma.accountTransaction.findMany({
      where: {
        clientId,
        type: 'CHARGE'
      },
      include: { paymentsApplied: true },
      orderBy: { date: 'asc' }
    });

    const pendientes = charges.filter(c => {
      const applied = c.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
      return applied < c.amount;
    }).map(c => {
      const applied = c.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
      return {
        id: c.id,
        date: c.date,
        description: c.description,
        amount: c.amount,
        applied: applied,
        debt: c.amount - applied
      };
    });

    return NextResponse.json(pendientes);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching pending charges' }, { status: 500 });
  }
}
