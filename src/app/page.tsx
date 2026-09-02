import Link from 'next/link';
import { prisma } from '@/lib/prisma';

// Revalidar cada 10 segundos o forzar dinamismo
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. Clientes Activos
  const totalClientes = await prisma.client.count({
    where: { isActive: true }
  });

  // 2. Facturación Estimada (Suma de abonos)
  const clientesData = await prisma.client.findMany({
    where: { isActive: true },
    select: { currentFee: true }
  });
  const facturacionEstimada = clientesData.reduce((acc, c) => acc + c.currentFee, 0);

  // 3. Deuda Total Pendiente (Saldo de Cuentas Corrientes a cobrar)
  const txsCtaCte = await prisma.accountTransaction.findMany({
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

  // 4. Tesorería General (Suma de cajas y bancos)
  const tesoreriaTxs = await prisma.treasuryTransaction.findMany({
    select: { amount: true }
  });
  const tesoreriaTotal = tesoreriaTxs.reduce((acc, t) => acc + t.amount, 0);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard General</h1>
        <p className="text-gray-600 mt-2">Bienvenido al sistema de gestión del Estudio Contable.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <Link href="/clientes" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Clientes Activos</h3>
          <p className="mt-4 text-4xl font-black text-gray-900">{totalClientes}</p>
        </Link>
        
        {/* Card 2 */}
        <Link href="/facturacion" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Facturación Mensual Estimada</h3>
          <p className="mt-4 text-4xl font-black text-indigo-700">
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
  );
}
