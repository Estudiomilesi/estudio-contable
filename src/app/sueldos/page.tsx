import { prisma } from '@/lib/prisma';
import SueldosClient from './SueldosClient';

export const dynamic = 'force-dynamic';

export default async function SueldosPage() {
  const salaries = await prisma.salary.findMany({
    include: { employee: true },
    orderBy: [
      { month: 'desc' },
      { employee: { name: 'asc' } }
    ]
  });

  const availableChecks = await prisma.check.findMany({
    where: { status: 'IN_PORTFOLIO' },
    orderBy: { dueDate: 'asc' }
  });

  return <SueldosClient initialSalaries={salaries} availableChecks={availableChecks} />;
}
