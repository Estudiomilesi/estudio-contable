import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HistorialChequesPage() {
  const checks = await prisma.check.findMany({
    orderBy: { issueDate: 'desc' },
    include: {
      client: true,
      incomingTx: true,
      outgoingTx: true
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/tesoreria" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-200">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Historial de Cheques</h1>
          <p className="mt-2 text-gray-600">Registro histórico de todos los cheques recibidos y entregados.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fecha Ingreso</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Banco</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">N° Cheque</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cliente/Origen</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Importe</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Salida/Destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {checks.map(check => (
                <tr key={check.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(check.issueDate).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {check.bank}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {check.number}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(check.dueDate).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {check.client?.name || check.incomingTx?.description || 'Ingreso manual'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                    ${check.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {check.status === 'IN_PORTFOLIO' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        En Cartera
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Entregado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[200px]" title={check.outgoingTx?.description || ''}>
                    {check.status === 'DELIVERED' ? (
                      check.outgoingTx ? (
                        <>
                          <span className="text-xs text-gray-500 block">{new Date(check.outgoingTx.date).toLocaleDateString('es-AR')}</span>
                          {check.outgoingTx.description}
                        </>
                      ) : 'Entregado (sin detalle)'
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {checks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No hay cheques registrados en el historial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
