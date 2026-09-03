"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

type Transaccion = any;

export default function ReportClient({ transacciones, isFacturado, initialLabel }: { transacciones: Transaccion[], isFacturado: boolean, initialLabel: string }) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>(initialLabel || 'ALL');

  const getCaja = (desc: string) => {
    if (!desc) return '-';
    const match = desc.match(/^Pago ingresado en (.*?) - /);
    if (match && match[1]) return match[1];
    return '-';
  };

  const processedData = useMemo(() => {
    let result = [...transacciones];
    
    if (filterLabel !== 'ALL') {
      if (filterLabel === 'FJ_JF') {
        result = result.filter(t => t.client?.professionalLabel === 'FJ' || t.client?.professionalLabel === 'JF');
      } else {
        result = result.filter(t => t.client?.professionalLabel === filterLabel);
      }
    }
    
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'client') {
          aVal = a.client?.name || '';
          bVal = b.client?.name || '';
        } else if (sortConfig.key === 'label') {
          aVal = a.client?.professionalLabel || '';
          bVal = b.client?.professionalLabel || '';
        } else if (sortConfig.key === 'caja') {
          aVal = getCaja(a.description || '');
          bVal = getCaja(b.description || '');
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [transacciones, sortConfig, filterLabel]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const currentTotalAmount = processedData.reduce((sum, t) => sum + t.amount, 0);
  const currentTotalNeto = processedData.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const currentTotalIva = processedData.reduce((sum, t) => sum + (t.ivaAmount || 0), 0);

  const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span className="ml-1 text-gray-300 opacity-0 group-hover:opacity-100">↕</span>;
    return <span className="ml-1 text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

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
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total {filterLabel !== 'ALL' ? 'Filtrado' : 'Acumulado'}</p>
          <p className={`text-4xl font-black ${isFacturado ? 'text-indigo-700' : 'text-green-700'}`}>
            ${currentTotalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('date')}>Fecha {renderSortIcon('date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('client')}>Cliente {renderSortIcon('client')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                  <div className="flex items-center gap-2">
                    <span className="cursor-pointer group flex items-center" onClick={() => requestSort('label')}>
                      Etiqueta {renderSortIcon('label')}
                    </span>
                    <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)} className="text-xs border-gray-300 rounded focus:ring-indigo-500 font-normal py-0 pl-2 pr-6 h-6">
                      <option value="ALL">Todas</option>
                      <option value="F">F</option>
                      <option value="FJ">FJ</option>
                      <option value="JF">JF</option>
                      <option value="FJ_JF">FJ+JF</option>
                    </select>
                  </div>
                </th>
                {!isFacturado && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('caja')}>Caja {renderSortIcon('caja')}</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('description')}>Detalle {renderSortIcon('description')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('netAmount')}>Neto {renderSortIcon('netAmount')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('ivaAmount')}>IVA {renderSortIcon('ivaAmount')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('amount')}>Total {renderSortIcon('amount')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={isFacturado ? 7 : 8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay registros para este período.
                  </td>
                </tr>
              ) : (
                processedData.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(t.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {t.client?.name || 'Consumidor Final'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {t.client?.professionalLabel ? (
                        <span className={`inline-flex rounded-full px-2 text-xs font-bold leading-5 ${t.client.professionalLabel === 'F' ? 'bg-green-200 text-green-900' : t.client.professionalLabel === 'FJ' ? 'bg-orange-200 text-orange-900' : 'bg-blue-200 text-blue-900'}`}>
                          {t.client.professionalLabel}
                        </span>
                      ) : '-'}
                    </td>
                    {!isFacturado && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                        {getCaja(t.description || '')}
                      </td>
                    )}
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
            {processedData.length > 0 && (
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={isFacturado ? 4 : 5} className="px-6 py-4 text-right text-sm text-gray-900 uppercase">Totales</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${currentTotalNeto.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${currentTotalIva.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isFacturado ? 'text-indigo-700' : 'text-green-700'}`}>
                    ${currentTotalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}
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
