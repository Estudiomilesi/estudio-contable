import { prisma } from '@/lib/prisma';
import RankingClient from './RankingClient';

export const dynamic = 'force-dynamic';

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const params = await searchParams;
  const isFacturado = params.tipo === 'facturado';
  const typeFilter = isFacturado ? 'CHARGE' : 'PAYMENT';

  // Obtener los últimos 6 meses (incluyendo el actual)
  const today = new Date();
  const months: { key: string, label: string }[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStr = d.toISOString().substring(0, 7); // "YYYY-MM"
    
    // Capitalize first letter of month
    let label = new Intl.DateTimeFormat('es-AR', { month: 'short', year: 'numeric' }).format(d);
    label = label.charAt(0).toUpperCase() + label.slice(1);
    
    months.push({ key: monthStr, label });
  }

  const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  
  const { headers } = await import('next/headers');
  const isJuanma = (await headers()).get('x-is-juanma') === 'true';

  const whereClause: any = {};
  if (isJuanma) {
    whereClause.professionalLabel = { in: ['FJ', 'JF'] };
  }

  // Buscar clientes y sus transacciones en este período
  const clientes = await prisma.client.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      professionalLabel: true,
      accountTransactions: {
        where: {
          type: typeFilter,
          date: { gte: startDate },
          NOT: isFacturado ? [] : [
            { description: { startsWith: 'NC:' } },
            { description: { contains: 'aldo a favor' } }
          ]
        },
        select: {
          date: true,
          amount: true,
          netAmount: true
        }
      }
    }
  });

  // Agrupar por mes
  const data = clientes.map(c => {
    const row: any = {
      id: c.id,
      name: c.name,
      label: c.professionalLabel,
      total: 0
    };

    months.forEach(m => {
      row[m.key] = 0;
    });

    c.accountTransactions.forEach(tx => {
      const txMonth = tx.date.toISOString().substring(0, 7);
      if (row[txMonth] !== undefined) {
        const amt = tx.netAmount || tx.amount;
        row[txMonth] += amt;
        row.total += amt;
      }
    });

    return row;
  });

  return <RankingClient data={data} months={months} isFacturado={isFacturado} />;
}
