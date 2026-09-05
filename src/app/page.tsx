import Link from 'next/link';
import { prisma } from '@/lib/prisma';

import DashboardFilter from '@/components/DashboardFilter';

// Revalidar cada 10 segundos o forzar dinamismo
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ label?: string }> }) {
  const { label } = await searchParams;
  const { headers } = await import('next/headers');
  const isJuanma = (await headers()).get('x-is-juanma') === 'true';

  const currentLabel = isJuanma ? 'FJ_JF' : (label || 'ALL');

  // Build the label filter object for Prisma Client queries
  let clientLabelFilter: any = undefined;
  if (currentLabel === 'F') {
    clientLabelFilter = 'F';
  } else if (currentLabel === 'FJ') {
    clientLabelFilter = 'FJ';
  } else if (currentLabel === 'JF') {
    clientLabelFilter = 'JF';
  } else if (currentLabel === 'FJ_JF') {
    clientLabelFilter = { in: ['FJ', 'JF'] };
  }

  // Define where clause for Client queries
  const clientWhere = {
    isActive: true,
    hasAbono: true,
    ...(clientLabelFilter && { professionalLabel: clientLabelFilter })
  };

  // 1. Abonos Activos (clientes con hasAbono = true y filtrado por etiqueta)
  const totalAbonosActivos = await prisma.client.count({
    where: clientWhere
  });

  // 2. Facturación Estimada (Suma de abonos de esos clientes)
  const clientesData = await prisma.client.findMany({
    where: clientWhere,
    select: { currentFee: true }
  });
  const facturacionEstimada = clientesData.reduce((acc, c) => acc + c.currentFee, 0);

  // Fechas del mes actual para filtros
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Define where clause for AccountTransaction queries (needs Client relation to filter)
  const txWhere = {
    ...(clientLabelFilter && {
      client: { professionalLabel: clientLabelFilter }
    })
  };

  // 3. Facturación Mes en Curso (Cargos del mes)
  const facturacionMes = await prisma.accountTransaction.findMany({
    where: {
      type: 'CHARGE',
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      ...txWhere
    }
  });
  const facturacionMesTotal = facturacionMes.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);

  // 4. Cobrado Mes en Curso (Pagos del mes, excluyendo Notas de Crédito)
  const cobradoMes = await prisma.accountTransaction.findMany({
    where: {
      type: 'PAYMENT',
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      NOT: [
        { description: { startsWith: 'NC:' } },
        { description: { contains: 'aldo a favor' } }
      ],
      ...txWhere
    }
  });
  const cobradoMesTotal = cobradoMes.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);

  // 5. Deuda Total Pendiente (Saldo de Cuentas Corrientes a cobrar)
  const txsCtaCte = await prisma.accountTransaction.findMany({
    where: txWhere,
    include: {
      paymentsApplied: true,
      chargesCovered: true
    }
  });

  // Agrupamos saldos por cliente
  const clientBalances: Record<string, number> = {};
  txsCtaCte.forEach(tx => {
    if (!clientBalances[tx.clientId]) clientBalances[tx.clientId] = 0;
    if (tx.type === 'CHARGE') {
      clientBalances[tx.clientId] += tx.amount;
    } else {
      clientBalances[tx.clientId] -= tx.amount;
    }
  });

  let deudaPendienteTotal = 0;
  Object.values(clientBalances).forEach(bal => {
    if (bal > 0) deudaPendienteTotal += bal;
  });

  // 6. Tesorería General (Suma de cajas y bancos)
  // Nota: Si se filtra por etiqueta, las transacciones sin cliente (gastos generales) se ignorarán.
  const tesoreriaTxs = await prisma.treasuryTransaction.aggregate({
    where: {
      account: { not: 'CAJA IVA' },
      ...(clientLabelFilter && {
        client: { professionalLabel: clientLabelFilter }
      })
    },
    _sum: { amount: true }
  });
  const tesoreriaTotal = tesoreriaTxs._sum.amount || 0;

  // Fechas del mes anterior para proporciones
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const firstDayPrev = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
  const lastDayPrev = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59);

  // Calcular proporción de abonos para prorrateo de gastos
  let abonosPeriod = await prisma.accountTransaction.findMany({
    where: {
      type: 'CHARGE',
      date: { gte: firstDayPrev, lte: lastDayPrev },
      description: { contains: 'Abono Mensual' }
    },
    include: { client: { select: { professionalLabel: true } } }
  });

  if (abonosPeriod.length === 0) {
    const lastAbono = await prisma.accountTransaction.findFirst({
      where: {
        type: 'CHARGE',
        date: { lt: firstDayPrev },
        description: { contains: 'Abono Mensual' }
      },
      orderBy: { date: 'desc' }
    });

    if (lastAbono) {
      const knownFirstDay = new Date(lastAbono.date.getFullYear(), lastAbono.date.getMonth(), 1);
      const knownLastDay = new Date(lastAbono.date.getFullYear(), lastAbono.date.getMonth() + 1, 0, 23, 59, 59);
      abonosPeriod = await prisma.accountTransaction.findMany({
        where: {
          type: 'CHARGE',
          date: { gte: knownFirstDay, lte: knownLastDay },
          description: { contains: 'Abono Mensual' }
        },
        include: { client: { select: { professionalLabel: true } } }
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

  // Fetch gastos de tesorería del mes actual
  const egresos = await prisma.treasuryTransaction.findMany({
    where: {
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      OR: [
        { type: 'EXPENSE' },
        { category: 'Retiro Fede' },
        { category: 'Retiro Juanma' }
      ]
    },
    include: { client: { select: { professionalLabel: true } } }
  });

  let gastosPagados = 0;

  egresos.forEach(e => {
    const amt = Math.abs(e.amount);
    // Ignore direct withdrawals for provisional result (they are profit distributions, not expenses)
    if (e.category === 'Retiro Fede' || e.category === 'Retiro Juanma') return;
    
    if (e.category === 'Participacion') {
      const isExpense = e.type === 'EXPENSE';
      const expenseAmt = isExpense ? amt : -amt;
      
      if (currentLabel === 'ALL') {
        gastosPagados += expenseAmt;
      } else if (currentLabel === 'F' && e.client?.professionalLabel === 'F') {
        gastosPagados += expenseAmt;
      } else if ((currentLabel === 'FJ' || currentLabel === 'JF' || currentLabel === 'FJ_JF') && (e.client?.professionalLabel === 'FJ' || e.client?.professionalLabel === 'JF')) {
        // If the dashboard is filtering by FJ or JF, we show the participation expenses that belong to FJ/JF
        gastosPagados += expenseAmt;
      }
    } else {
      // Gastos comunes prorrateables
      const isExpense = e.type === 'EXPENSE';
      const expenseAmt = isExpense ? amt : -amt;
      
      if (currentLabel === 'ALL') {
        gastosPagados += expenseAmt;
      } else if (currentLabel === 'F') {
        gastosPagados += expenseAmt * propF;
      } else if (currentLabel === 'FJ' || currentLabel === 'JF' || currentLabel === 'FJ_JF') {
        // If the dashboard is filtering by FJ or JF, we show the prorated portion for FJ
        // Note: For 'JF', we show the whole 'propFJ' block because they share expenses.
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
          {/* Card 1 */}
          <Link href="/facturacion" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Abonos Activos</h3>
            <p className="mt-4 text-4xl font-black text-gray-900">{totalAbonosActivos}</p>
          </Link>
          
          {/* Card 2 */}
          <Link href="/facturacion" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Abonos Estimado</h3>
            <p className="mt-4 text-4xl font-black text-gray-900">
              ${facturacionEstimada.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          {/* Card 3 */}
          <Link href="/cuentas-corrientes" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-red-600 transition-colors">Deuda a Cobrar (Cta. Cte.)</h3>
            <p className="mt-4 text-4xl font-black text-red-600">
              ${deudaPendienteTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          {/* Card 4 */}
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
          {/* Card 5 */}
          <Link href={`/reportes/mes?tipo=facturado&label=${currentLabel}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Facturado este mes</h3>
            <p className="mt-4 text-4xl font-black text-indigo-700">
              ${facturacionMesTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          {/* Card 6 */}
          <Link href={`/reportes/mes?tipo=cobrado&label=${currentLabel}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-green-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-green-600 transition-colors">Cobrado este mes</h3>
            <p className="mt-4 text-4xl font-black text-green-700">
              ${cobradoMesTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          {/* Card 7 */}
          <Link href="/reportes/fin-de-mes#gastos" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-red-600 transition-colors">Gastos pagados este mes</h3>
            <p className="mt-4 text-4xl font-black text-red-600">
              -${gastosPagados.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </Link>

          {/* Card 8 */}
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
