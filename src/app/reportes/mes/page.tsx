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
    type: isFacturado ? 'CHARGE' : 'PAYMENT',
    date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
    ...txWhere
  };

  if (!isFacturado) {
    whereClause.NOT = [
      { description: { startsWith: 'NC' } },
      { description: { contains: 'aldo a favor' } }
    ];
  }

  const transacciones = await prisma.accountTransaction.findMany({
    where: whereClause,
    include: { client: true },
    orderBy: { date: 'desc' }
  });

  let extraTransacciones: any[] = [];
  if (!isFacturado) {
    // Si estamos viendo cobros, inyectar los cobros manuales de Tesorería (migración inicial de honorarios)
    const treasuryWhere: any = {
      category: 'Honorarios',
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      description: { in: ['Migración inicial', '181.500 Honorarios 38.115 IVA', '532.500 honorarios, 111.825 IVA'] },
      ...(clientLabelFilter && { client: { professionalLabel: clientLabelFilter } })
    };
    const treasuryTxs = await prisma.treasuryTransaction.findMany({
      where: treasuryWhere,
      include: { client: true }
    });

    extraTransacciones = treasuryTxs.map(t => ({
      id: t.id,
      clientId: t.clientId,
      client: t.client,
      date: t.date,
      type: 'PAYMENT',
      billingProfile: 'NO_FISCAL', // as fallback
      netAmount: t.amount,
      ivaAmount: 0,
      amount: t.amount,
      description: t.description || 'Honorarios Cobrados (Tesoreria)',
      dueDate: null,
      receiptNumber: null,
      receiptFileBase64: null,
      createdAt: t.createdAt,
      isEmailed: false
    }));
  }

  const allTransacciones = [...transacciones, ...extraTransacciones].sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalAmount = allTransacciones.reduce((sum, t) => sum + t.amount, 0);
  const totalNeto = allTransacciones.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const totalIva = allTransacciones.reduce((sum, t) => sum + (t.ivaAmount || 0), 0);

  return <ReportClient transacciones={allTransacciones} isFacturado={isFacturado} initialLabel={currentLabel} isJuanma={isJuanma} />;
}
