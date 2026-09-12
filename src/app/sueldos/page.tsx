import { prisma } from '@/lib/prisma';
import SueldosClient from './SueldosClient';

export const dynamic = 'force-dynamic';

export default async function SueldosPage() {
  const salariesRaw = await prisma.salary.findMany({
    include: { employee: true, treasuryTxs: true },
    orderBy: [
      { month: 'desc' },
      { employee: { name: 'asc' } }
    ]
  });

  const salaries = salariesRaw.map(s => {
    const paidAmount = s.treasuryTxs.reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const effectivePaidAmount = s.isPaid && paidAmount === 0 ? s.amount : paidAmount;
    const pendingAmount = Math.max(0, s.amount - effectivePaidAmount);
    const isFullyPaid = pendingAmount <= 1;

    return {
      ...s,
      paidAmount: effectivePaidAmount,
      pendingAmount,
      isPaid: isFullyPaid
    };
  });

  const availableChecks = await prisma.check.findMany({
    where: { status: 'IN_PORTFOLIO' },
    orderBy: { dueDate: 'asc' }
  });

  return <SueldosClient initialSalaries={salaries} availableChecks={availableChecks} />;
}
