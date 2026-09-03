import Link from 'next/link';
import { prisma } from '@/lib/prisma';

import DashboardFilter from '@/components/DashboardFilter';

// Revalidar cada 10 segundos o forzar dinamismo
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ label?: string }> }) {
  const { label } = await searchParams;
  const currentLabel = label || 'ALL';

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
  const facturacionMes = await prisma.accountTransaction.aggregate({
    where: {
      type: 'CHARGE',
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      ...txWhere
    },
    _sum: { amount: true }
  });
  const facturacionMesTotal = facturacionMes._sum.amount || 0;

  // 4. Cobrado Mes en Curso (Pagos del mes, excluyendo Notas de Crédito)
  const cobradoMes = await prisma.accountTransaction.aggregate({
    where: {
      type: 'PAYMENT',
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      NOT: [
        { description: { startsWith: 'NC:' } },
        { description: { contains: 'aldo a favor' } }
      ],
      ...txWhere
    },
    _sum: { amount: true }
  });
  const cobradoMesTotal = cobradoMes._sum.amount || 0;

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
      ...(clientLabelFilter && {
        client: { professionalLabel: clientLabelFilter }
      })
    },
    _sum: { amount: true }
  });
  const tesoreriaTotal = tesoreriaTxs._sum.amount || 0;


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard General</h1>
          <p className="text-gray-600 mt-2">Bienvenido al sistema de gestión del Estudio Contable.</p>
        </div>
        <DashboardFilter currentLabel={currentLabel} />
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
              ${facturacionEstimada.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </p>
          </Link>

          {/* Card 3 */}
          <Link href="/cuentas-corrientes" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-red-600 transition-colors">Deuda a Cobrar (Cta. Cte.)</h3>
            <p className="mt-4 text-4xl font-black text-red-600">
              ${deudaPendienteTotal.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </p>
          </Link>

          {/* Card 4 */}
          <Link href="/tesoreria" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-green-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-green-600 transition-colors">Total Tesorería (Disp.)</h3>
            <p className="mt-4 text-4xl font-black text-green-600">
              ${tesoreriaTotal.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
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
              ${facturacionMesTotal.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </p>
          </Link>

          {/* Card 6 */}
          <Link href={`/reportes/mes?tipo=cobrado&label=${currentLabel}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-green-400 transition-all cursor-pointer group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-green-600 transition-colors">Cobrado este mes</h3>
            <p className="mt-4 text-4xl font-black text-green-700">
              ${cobradoMesTotal.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
