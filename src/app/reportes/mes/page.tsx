import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ReportClient from './ReportClient';

export const dynamic = 'force-dynamic';

export default async function ReportesMesPage({ searchParams }: { searchParams: Promise<{ tipo?: string, label?: string }> }) {
  const { tipo, label } = await searchParams;
  const { headers } = await import('next/headers');
  const isJuanma = (await headers()).get('x-is-juanma') === 'true';

  const isFacturado = tipo === 'facturado';
  const currentLabel = isJuanma ? 'FJ_JF' : (label || 'ALL');

  let clientLabelFilter: any = undefined;
  if (currentLabel === 'F') clientLabelFilter = 'F';
  else if (currentLabel === 'FJ') clientLabelFilter = 'FJ';
  else if (currentLabel === 'JF') clientLabelFilter = 'JF';
  else if (currentLabel === 'FJ_JF') clientLabelFilter = { in: ['FJ', 'JF'] };

  const txWhere = {
    ...(clientLabelFilter && { client: { professionalLabel: clientLabelFilter } })
  };

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const whereClause: any = {
    date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
    ...txWhere
  };

  if (isFacturado) {
    whereClause.OR = [
      { type: 'CHARGE', NOT: { description: { contains: 'Migración' } } },
      { type: 'PAYMENT', description: { startsWith: 'NC' } }
    ];
  } else {
    whereClause.type = 'PAYMENT';
    whereClause.NOT = [
      { description: { startsWith: 'NC' } },
      { description: { contains: 'aldo a favor' } }
    ];
  }

  const rawTransacciones = await prisma.accountTransaction.findMany({
    where: whereClause,
    include: { client: true, items: true },
    orderBy: { date: 'desc' }
  });

  const transacciones = rawTransacciones.map(t => {
    if (isFacturado && t.description && t.description.startsWith('NC')) {
      return { 
        ...t, 
        amount: -Math.abs(t.amount), 
        netAmount: -Math.abs(t.netAmount || t.amount), 
        ivaAmount: -Math.abs(t.ivaAmount || 0) 
      };
    }
    return t;
  });

  const totalAmount = transacciones.reduce((sum, t) => sum + t.amount, 0);
  const totalNeto = transacciones.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const totalIva = transacciones.reduce((sum, t) => sum + (t.ivaAmount || 0), 0);

  return <ReportClient transacciones={transacciones} isFacturado={isFacturado} initialLabel={currentLabel} isJuanma={isJuanma} />;
}
