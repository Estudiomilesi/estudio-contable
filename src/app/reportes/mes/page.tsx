import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReportesMesPage({ searchParams }: { searchParams: Promise<{ tipo?: string, label?: string }> }) {
  const { tipo, label } = await searchParams;
  const isFacturado = tipo === 'facturado';
  const currentLabel = label || 'ALL';

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
      { description: { startsWith: 'NC:' } },
      { description: { contains: 'aldo a favor' } }
    ];
  }

  const transacciones = await prisma.accountTransaction.findMany({
    where: whereClause,
    include: { client: true },
    orderBy: { date: 'desc' }
  });

  const totalAmount = transacciones.reduce((sum, t) => sum + t.amount, 0);
  const totalNeto = transacciones.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const totalIva = transacciones.reduce((sum, t) => sum + (t.ivaAmount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-indigo-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Reporte: {isFacturado ? 'Facturado este mes' : 'Cobrado este mes'}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">Detalle de movimientos que conforman el total del dashboard.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Acumulado</p>
          <p className={`text-4xl font-black ${isFacturado ? 'text-indigo-700' : 'text-green-700'}`}>
            ${totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Neto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transacciones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay registros para este período.
                  </td>
                </tr>
              ) : (
                transacciones.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(t.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {t.client?.name || 'Consumidor Final'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {t.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                      ${(t.netAmount || t.amount).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                      ${(t.ivaAmount || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      ${t.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {transacciones.length > 0 && (
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm text-gray-900 uppercase">Totales</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${totalNeto.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${totalIva.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isFacturado ? 'text-indigo-700' : 'text-green-700'}`}>
                    ${totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
