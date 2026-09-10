import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DashboardFilter from '@/components/DashboardFilter';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ label?: string }> }) {
  const { label } = await searchParams;
  const { headers } = await import('next/headers');
  const isJuanma = (await headers()).get('x-is-juanma') === 'true';

  const currentLabel = isJuanma ? 'FJ_JF' : (label || 'ALL');

  let clientLabelFilter: any = undefined;
  if (currentLabel === 'F') clientLabelFilter = 'F';
  else if (currentLabel === 'FJ') clientLabelFilter = 'FJ';
  else if (currentLabel === 'JF') clientLabelFilter = 'JF';
  else if (currentLabel === 'FJ_JF') clientLabelFilter = { in: ['FJ', 'JF'] };

  const clientWhere = {
    isActive: true,
    hasAbono: true,
    ...(clientLabelFilter && { professionalLabel: clientLabelFilter })
  };

  const txWhere = {
    ...(clientLabelFilter && {
      client: { professionalLabel: clientLabelFilter }
    })
  };

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const firstDayPrev = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
  const lastDayPrev = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59);

  // Run all independent queries in parallel to drastically reduce TTFB (Time To First Byte)
  const [
    totalAbonosActivos,
    facturacionEstimadaAggr,
    facturacionMesData,
    cobradoMesData,
    tesoreriaTxsAggr,
    groupedTxs,
    abonosPeriodData,
    egresosData
  ] = await Promise.all([
    // 1. Abonos Activos
    prisma.client.count({ where: clientWhere }),
    
    // 2. Facturación Estimada
    prisma.client.aggregate({
      where: clientWhere,
      _sum: { currentFee: true }
    }),
    
    // 3. Facturación Mes en Curso
    prisma.accountTransaction.findMany({
      where: {
        type: 'CHARGE',
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        ...txWhere
      },
      select: { netAmount: true, amount: true }
    }),
    
    // 4. Cobrado Mes en Curso
    prisma.accountTransaction.findMany({
      where: {
        type: 'PAYMENT',
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        NOT: [
          { description: { startsWith: 'NC' } },
          { description: { contains: 'aldo a favor' } }
        ],
        ...txWhere
      },
      select: { netAmount: true, amount: true }
    }),
    
    // 6. Tesorería General
    prisma.treasuryTransaction.aggregate({
      where: { account: { not: 'CAJA IVA' } },
      _sum: { amount: true }
    }),

    // 5. Deuda Total Pendiente (Agrupado en BD)
    prisma.accountTransaction.groupBy({
      by: ['clientId', 'type'],
      where: txWhere,
      _sum: { amount: true }
    }),

    // 7. Abonos Periodo (Proporción gastos)
    prisma.accountTransaction.findMany({
      where: {
        type: 'CHARGE',
        date: { gte: firstDayPrev, lte: lastDayPrev },
        description: { contains: 'Abono Mensual' }
      },
      select: { amount: true, netAmount: true, client: { select: { professionalLabel: true } } }
    }),

    // 8. Egresos
    prisma.treasuryTransaction.findMany({
      where: {
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        OR: [
          { type: 'EXPENSE' },
          { category: 'Retiro Fede' },
          { category: 'Retiro Juanma' }
        ]
      },
      select: { amount: true, type: true, category: true, client: { select: { professionalLabel: true } } }
    })
  ]);

  const facturacionEstimada = facturacionEstimadaAggr._sum.currentFee || 0;
  const facturacionMesTotal = facturacionMesData.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const cobradoMesTotal = cobradoMesData.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const tesoreriaTotal = tesoreriaTxsAggr._sum.amount || 0;

  // Compute pending debt using the DB grouped results
  const clientBalances: Record<string, number> = {};
  groupedTxs.forEach(g => {
    if (!clientBalances[g.clientId]) clientBalances[g.clientId] = 0;
    if (g.type === 'CHARGE') clientBalances[g.clientId] += (g._sum.amount || 0);
    else clientBalances[g.clientId] -= (g._sum.amount || 0);
  });
  
  let deudaPendienteTotal = 0;
  Object.values(clientBalances).forEach(bal => {
    if (bal > 0) deudaPendienteTotal += bal; // Solo sumamos clientes que nos deben
  });

  // Fallback for abonosPeriod
  let abonosPeriod = abonosPeriodData;
  if (abonosPeriod.length === 0) {
    const lastAbono = await prisma.accountTransaction.findFirst({
      where: { type: 'CHARGE', date: { lt: firstDayPrev }, description: { contains: 'Abono Mensual' } },
      orderBy: { date: 'desc' }
    });
    if (lastAbono) {
      const knownFirstDay = new Date(lastAbono.date.getFullYear(), lastAbono.date.getMonth(), 1);
      const knownLastDay = new Date(lastAbono.date.getFullYear(), lastAbono.date.getMonth() + 1, 0, 23, 59, 59);
      abonosPeriod = await prisma.accountTransaction.findMany({
        where: { type: 'CHARGE', date: { gte: knownFirstDay, lte: knownLastDay }, description: { contains: 'Abono Mensual' } },
        select: { amount: true, netAmount: true, client: { select: { professionalLabel: true } } }
      });
    }
  }

  let totalAbonosF = 0;
  let totalAbonosFJ = 0;
  let totalAbonos = 0;
  abonosPeriod.forEach(a => {
    const amt = a.netAmount || a.amount;
    totalAbonos += amt;
    if (a.client?.professionalLabel === 'F') totalAbonosF += amt;
    else if (a.client?.professionalLabel === 'FJ' || a.client?.professionalLabel === 'JF') totalAbonosFJ += amt;
  });

  let propF = totalAbonos > 0 ? totalAbonosF / totalAbonos : 0;
  let propFJ = totalAbonos > 0 ? totalAbonosFJ / totalAbonos : 0;
  if (totalAbonos === 0) {
    propF = 0.365;
    propFJ = 0.312 + 0.323; // 63.5%
  }

  let gastosPagados = 0;
  egresosData.forEach(e => {
    const amt = Math.abs(e.amount);
    if (e.category === 'Retiro Fede' || e.category === 'Retiro Juanma') return;
    
    if (e.category === 'Participacion') {
      const isExpense = e.type === 'EXPENSE';
      const expenseAmt = isExpense ? amt : -amt;
      
      if (currentLabel === 'ALL') {
        gastosPagados += expenseAmt;
      } else if (currentLabel === 'F' && e.client?.professionalLabel === 'F') {
        gastosPagados += expenseAmt;
      } else if ((currentLabel === 'FJ' || currentLabel === 'JF' || currentLabel === 'FJ_JF') && (e.client?.professionalLabel === 'FJ' || e.client?.professionalLabel === 'JF')) {
        gastosPagados += expenseAmt;
      }
    } else {
      const isExpense = e.type === 'EXPENSE';
      const expenseAmt = isExpense ? amt : -amt;
      
      if (currentLabel === 'ALL') {
        gastosPagados += expenseAmt;
      } else if (currentLabel === 'F') {
        gastosPagados += expenseAmt * propF;
      } else if (currentLabel === 'FJ' || currentLabel === 'JF' || currentLabel === 'FJ_JF') {
        gastosPagados += expenseAmt * propFJ;
      }
    }
  });

  const resultadoProvisorio = cobradoMesTotal - gastosPagados;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard General</h1>
          <p className="text-gray-600 mt-2">Bienvenido al sistema de gestión del Estudio Contable.</p>
        </div>
        {!isJuanma && <DashboardFilter currentLabel={currentLabel} />}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Resumen General</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/facturacion" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Abonos Activos</h3>
            <p className="mt-4 text-4xl font-black text-gray-900">{totalAbonosActivos}</p>
          </Link>
          
          <Link href="/facturacion" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Abonos Estimado</h3>
            <p className="mt-4 text-4xl font-black text-gray-900">
              ${facturacionEstimada.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          <Link href="/cuentas-corrientes" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-red-600 transition-colors">Deuda a Cobrar (Cta. Cte.)</h3>
            <p className="mt-4 text-4xl font-black text-red-600">
              ${deudaPendienteTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          <Link href="/tesoreria" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-green-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-green-600 transition-colors">Total Tesorería (Disp.)</h3>
            <p className="mt-4 text-4xl font-black text-green-600">
              ${tesoreriaTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Avance del Mes en Curso</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href={`/reportes/mes?tipo=facturado&label=${currentLabel}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Facturado este mes</h3>
            <p className="mt-4 text-4xl font-black text-indigo-700">
              ${facturacionMesTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          <Link href={`/reportes/mes?tipo=cobrado&label=${currentLabel}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-green-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-green-600 transition-colors">Cobrado este mes</h3>
            <p className="mt-4 text-4xl font-black text-green-700">
              ${cobradoMesTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          <Link href="/reportes/fin-de-mes#gastos" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-red-600 transition-colors">Gastos pagados este mes</h3>
            <p className="mt-4 text-4xl font-black text-red-600">
              -${gastosPagados.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          <Link href="/reportes/fin-de-mes" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Resultado Provisorio</h3>
            <p className={`mt-4 text-4xl font-black ${resultadoProvisorio >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${resultadoProvisorio.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
