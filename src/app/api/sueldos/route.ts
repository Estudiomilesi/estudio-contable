import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const salariesRaw = await prisma.salary.findMany({
      include: {
        employee: true,
        treasuryTxs: true
      },
      orderBy: [
        { month: 'desc' },
        { employee: { name: 'asc' } }
      ]
    });

    const salaries = salariesRaw.map(s => {
      const paidAmount = s.treasuryTxs.reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
      // For legacy data where isPaid is true but no treasuryTxs are linked, assume fully paid
      const effectivePaidAmount = s.isPaid && paidAmount === 0 ? s.amount : paidAmount;
      const pendingAmount = Math.max(0, s.amount - effectivePaidAmount);
      const isFullyPaid = pendingAmount <= 1; // 1 peso tolerance

      return {
        ...s,
        paidAmount: effectivePaidAmount,
        pendingAmount,
        isPaid: isFullyPaid
      };
    });

    return NextResponse.json(salaries);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching salaries' }, { status: 500 });
  }
}
