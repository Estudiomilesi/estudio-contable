"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

type Row = any;
type MonthCol = { key: string, label: string };

export default function RankingClient({ data, months, isFacturado }: { data: Row[], months: MonthCol[], isFacturado: boolean }) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'total', direction: 'desc' });
  const [filterLabel, setFilterLabel] = useState<string>('ALL');

  const processedData = useMemo(() => {
    let result = [...data];
    
    // Solo clientes que tengan un total > 0 (si no, no facturaron/cobraron en 6 meses)
    result = result.filter(r => r.total > 0);

    if (filterLabel !== 'ALL') {
      if (filterLabel === 'FJ_JF') {
        result = result.filter(r => r.label === 'FJ' || r.label === 'JF');
      } else {
        result = result.filter(r => r.label === filterLabel);
      }
    }
    
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'label') {
        aVal = a.label || '';
        bVal = b.label || '';
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [data, sortConfig, filterLabel]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'; // Default to desc for numeric ranking
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span className="ml-1 text-gray-300 opacity-0 group-hover:opacity-100">↕</span>;
    return <span className="ml-1 text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const currentTotalAmount = processedData.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/reportes" className="text-gray-500 hover:text-indigo-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Ranking de {isFacturado ? 'Facturación' : 'Cobranzas'} (Últimos 6 meses)
            </h1>
          </div>
          <p className="text-gray-600 mt-2">Valores netos filtrados por cliente.</p>
        </div>
        <div className="text-right tabular-nums">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total {filterLabel !== 'ALL' ? 'Filtrado' : 'General'}</p>
          <p className={`text-4xl font-black ${isFacturado ? 'text-indigo-700' : 'text-green-700'}`}>
            ${currentTotalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('name')}>
                  Cliente {renderSortIcon('name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                  <div className="flex items-center gap-2">
                    <span className="cursor-pointer group flex items-center" onClick={() => requestSort('label')}>
                      Etiq {renderSortIcon('label')}
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
                {months.map(m => (
                  <th key={m.key} className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort(m.key)}>
                    {m.label} {renderSortIcon(m.key)}
                  </th>
                ))}
                <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('total')}>
                  Total {renderSortIcon('total')}
                </th>
                <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="text-gray-400 mr-2">{i+1}.</span>
                    {r.name}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">
                    {r.label ? (
                      <span className={`inline-flex rounded-full px-2 text-xs font-bold leading-5 ${r.label === 'F' ? 'bg-green-200 text-green-900' : r.label === 'FJ' ? 'bg-orange-200 text-orange-900' : 'bg-blue-200 text-blue-900'}`}>
                        {r.label}
                      </span>
                    ) : '-'}
                  </td>
                  {months.map(m => (
                    <td key={m.key} className="px-6 py-2 whitespace-nowrap text-sm text-gray-600 text-right tabular-nums">
                      {r[m.key] > 0 ? `$${r[m.key].toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                    </td>
                  ))}
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right tabular-nums">
                    ${r.total.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 text-right tabular-nums font-medium">
                    {currentTotalAmount > 0 ? ((r.total / currentTotalAmount) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {processedData.length === 0 && (
                <tr>
                  <td colSpan={months.length + 4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay registros en este período.
                  </td>
                </tr>
              )}
            </tbody>
            {processedData.length > 0 && (
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-right tabular-nums text-sm text-gray-900 uppercase">Totales</td>
                  {months.map(m => (
                    <td key={m.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right tabular-nums">
                      ${processedData.reduce((s, r) => s + r[m.key], 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  ))}
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right tabular-nums ${isFacturado ? 'text-indigo-700' : 'text-green-700'}`}>
                    ${currentTotalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right tabular-nums">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
