"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

type Transaccion = any;

export default function ReportClient({ transacciones, isFacturado, initialLabel, isJuanma }: { transacciones: Transaccion[], isFacturado: boolean, initialLabel: string, isJuanma?: boolean }) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>(initialLabel || 'ALL');
  const [viewMode, setViewMode] = useState<'DETALLADO' | 'AGRUPADO'>('DETALLADO');

  const getCaja = (desc: string) => {
    if (!desc) return '-';
    const match = desc.match(/^Pago ingresado en (.*?) - /);
    if (match && match[1]) return match[1];
    return '-';
  };

  const getConcept = (desc: string) => {
    if (!desc) return 'Otros';
    if (desc.startsWith('Pago ingresado')) return 'Pago';
    if (desc.startsWith('FACTURA NO VALIDA') || desc.startsWith('Factura')) return 'Honorarios (Manual)';
    
    let concept = desc;
    if (concept.startsWith('NC - ')) {
      concept = concept.substring(5).trim();
    }
    if (concept.includes(' - ')) {
      concept = concept.split(' - ')[0].trim();
    }
    concept = concept.replace(/\s*\([^)]*\)/g, '').trim();
    
    return concept || 'Otros';
  };

  const processedData = useMemo(() => {
    let result: any[] = [];
    
    transacciones.forEach(t => {
      // Filtrar por etiqueta
      let isValid = true;
      if (isJuanma) {
        if (t.client?.professionalLabel !== 'FJ' && t.client?.professionalLabel !== 'JF') isValid = false;
      } else if (filterLabel !== 'ALL') {
        if (filterLabel === 'FJ_JF') {
          if (t.client?.professionalLabel !== 'FJ' && t.client?.professionalLabel !== 'JF') isValid = false;
        } else {
          if (t.client?.professionalLabel !== filterLabel) isValid = false;
        }
      }
      
      if (!isValid) return;

      // Expandir items si existen (para desglosar facturas con mltiples conceptos)
      if (isFacturado && t.items && t.items.length > 0) {
        t.items.forEach((item: any) => {
          const isNC = t.description && t.description.startsWith('NC');
          const multiplier = isNC ? -1 : 1;
          result.push({
            ...t,
            id: item.id, // Usar el ID del item para que sea unico en la tabla
            conceptFromItem: item.concept,
            amount: Math.abs(item.amount) * multiplier,
            netAmount: Math.abs(item.amount) * multiplier, // Los items manuales no tienen IVA desglosado en la DB por item aun
            ivaAmount: 0
          });
        });
      } else {
        result.push(t);
      }
    });
    
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
        } else if (sortConfig.key === 'concept') {
          aVal = a.conceptFromItem || getConcept(a.description || '');
          bVal = b.conceptFromItem || getConcept(b.description || '');
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [transacciones, sortConfig, filterLabel, isJuanma, isFacturado]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const currentTotalAmount = processedData.reduce((sum, t) => sum + t.amount, 0);
  const currentTotalNeto = processedData.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const currentTotalIva = processedData.reduce((sum, t) => sum + (t.ivaAmount || 0), 0);

  const breakdown = useMemo(() => {
    let fCount = 0, fjCount = 0, jfCount = 0, otherCount = 0;
    let fTotal = 0, fjTotal = 0, jfTotal = 0, otherTotal = 0;
    let fNeto = 0, fjNeto = 0, jfNeto = 0, otherNeto = 0;
    let fIva = 0, fjIva = 0, jfIva = 0, otherIva = 0;

    processedData.forEach(t => {
      const amt = t.amount;
      const net = t.netAmount || t.amount;
      const iva = t.ivaAmount || 0;
      
      if (t.client?.professionalLabel === 'F') { 
        fCount++; fTotal += amt; fNeto += net; fIva += iva;
      }
      else if (t.client?.professionalLabel === 'FJ') { 
        fjCount++; fjTotal += amt; fjNeto += net; fjIva += iva;
      }
      else if (t.client?.professionalLabel === 'JF') { 
        jfCount++; jfTotal += amt; jfNeto += net; jfIva += iva;
      }
      else { 
        otherCount++; otherTotal += amt; otherNeto += net; otherIva += iva;
      }
    });

    const totalCount = processedData.length;
    const totalAmt = currentTotalAmount;
    const totalNetoAmt = currentTotalNeto;

    return {
      f: { count: fCount, total: fTotal, net: fNeto, iva: fIva, pctCount: totalCount ? (fCount/totalCount)*100 : 0, pctAmt: totalNetoAmt ? (fNeto/totalNetoAmt)*100 : 0 },
      fj: { count: fjCount, total: fjTotal, net: fjNeto, iva: fjIva, pctCount: totalCount ? (fjCount/totalCount)*100 : 0, pctAmt: totalNetoAmt ? (fjNeto/totalNetoAmt)*100 : 0 },
      jf: { count: jfCount, total: jfTotal, net: jfNeto, iva: jfIva, pctCount: totalCount ? (jfCount/totalCount)*100 : 0, pctAmt: totalNetoAmt ? (jfNeto/totalNetoAmt)*100 : 0 },
      other: { count: otherCount, total: otherTotal, net: otherNeto, iva: otherIva, pctCount: totalCount ? (otherCount/totalCount)*100 : 0, pctAmt: totalNetoAmt ? (otherNeto/totalNetoAmt)*100 : 0 },
      total: { count: totalCount, total: totalAmt }
    };
  }, [processedData, currentTotalAmount]);

  const groupedByConcept = useMemo(() => {
    const map = new Map<string, { count: number, net: number, iva: number, total: number }>();
    processedData.forEach(t => {
      const concept = t.conceptFromItem || getConcept(t.description);
      const net = t.netAmount || t.amount;
      const iva = t.ivaAmount || 0;
      const total = t.amount;

      const current = map.get(concept) || { count: 0, net: 0, iva: 0, total: 0 };
      current.count += 1;
      current.net += net;
      current.iva += iva;
      current.total += total;
      map.set(concept, current);
    });
    const arr = Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
    arr.sort((a, b) => b.net - a.net);
    return arr;
  }, [processedData]);

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
        <div className="text-right tabular-nums">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total {filterLabel !== 'ALL' ? 'Filtrado' : 'Acumulado'}</p>
          <p className={`text-4xl font-black ${isFacturado ? 'text-indigo-700' : 'text-green-700'}`}>
            ${currentTotalNeto.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      {isFacturado && (
        <div className="flex border-b border-gray-200 gap-4 mb-4">
          <button
            onClick={() => setViewMode('DETALLADO')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${viewMode === 'DETALLADO' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Detallado
          </button>
          <button
            onClick={() => setViewMode('AGRUPADO')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${viewMode === 'AGRUPADO' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Agrupado por Concepto
          </button>
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              {viewMode === 'AGRUPADO' ? (
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cant. Movimientos</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal Neto</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">Total Final</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% s/ Neto</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('date')}>Fecha {renderSortIcon('date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('client')}>Cliente {renderSortIcon('client')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer group flex items-center" onClick={() => requestSort('label')}>
                        Etiqueta {renderSortIcon('label')}
                      </span>
                      <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)} className="text-xs border-gray-300 rounded focus:ring-indigo-500 font-normal py-0 pl-2 pr-6 h-6">
                        <option value={isJuanma ? "FJ_JF" : "ALL"}>Todas</option>
                        {!isJuanma && <option value="F">F</option>}
                        <option value="FJ">FJ</option>
                        <option value="JF">JF</option>
                        <option value="FJ_JF">FJ+JF</option>
                      </select>
                    </div>
                  </th>
                  {!isFacturado && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('caja')}>Caja {renderSortIcon('caja')}</th>}
                  {isFacturado && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('concept')}>Concepto {renderSortIcon('concept')}</th>}
                  {!isFacturado && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('description')}>Detalle {renderSortIcon('description')}</th>}
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('netAmount')}>Neto {renderSortIcon('netAmount')}</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('ivaAmount')}>IVA {renderSortIcon('ivaAmount')}</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('amount')}>Total {renderSortIcon('amount')}</th>
                </tr>
              )}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {viewMode === 'AGRUPADO' ? (
                groupedByConcept.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-2 text-center text-sm text-gray-500">
                      No hay registros para este período.
                    </td>
                  </tr>
                ) : (
                  groupedByConcept.map((g) => {
                    const pct = currentTotalNeto ? ((g.net / currentTotalNeto) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={g.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {g.name}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                          {g.count}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                          ${g.net.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                          ${g.iva.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right tabular-nums">
                          ${g.total.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-center font-semibold">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                processedData.length === 0 ? (
                  <tr>
                    <td colSpan={isFacturado ? 8 : 8} className="px-6 py-2 text-center text-sm text-gray-500">
                      No hay registros para este período.
                    </td>
                  </tr>
                ) : (
                  processedData.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">
                        {new Date(t.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-2 text-sm font-medium text-gray-900">
                        {t.client?.name || 'Consumidor Final'}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">
                        {t.client?.professionalLabel ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold leading-5 ${t.client.professionalLabel === 'F' ? 'bg-green-200 text-green-900' : t.client.professionalLabel === 'FJ' ? 'bg-orange-200 text-orange-900' : 'bg-blue-200 text-blue-900'}`}>
                            {t.client.professionalLabel}
                          </span>
                        ) : '-'}
                      </td>
                      {!isFacturado && (
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-semibold text-gray-700">
                          {getCaja(t.description || '')}
                        </td>
                      )}
                      {isFacturado && (
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 font-medium">
                          {t.conceptFromItem || getConcept(t.description || '')}
                        </td>
                      )}
                      {!isFacturado && (
                        <td className="px-6 py-2 text-sm text-gray-500 max-w-xs truncate" title={t.description}>
                          {t.description}
                        </td>
                      )}
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                        ${(t.netAmount || t.amount).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                        ${(t.ivaAmount || 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right tabular-nums">
                        ${t.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
            {processedData.length > 0 && (
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-right tabular-nums text-sm text-gray-900 uppercase">Totales ({breakdown.total.count} Mov.)</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700">100%</td>
                  <td colSpan={isFacturado ? 1 : 2}></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right tabular-nums">
                    ${currentTotalNeto.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right tabular-nums">
                    ${currentTotalIva.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right tabular-nums ${isFacturado ? 'text-indigo-700' : 'text-green-700'}`}>
                    ${currentTotalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
                {breakdown.f.count > 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-2 text-right tabular-nums text-sm text-green-800">
                      Total F ({breakdown.f.count} | {breakdown.f.pctCount.toFixed(1)}%)
                    </td>
                    <td className="px-6 py-2 text-center">
                      <span className="text-green-900 px-1 rounded text-xs">{breakdown.f.pctAmt.toFixed(1)}%</span>
                    </td>
                    <td colSpan={isFacturado ? 1 : 2}></td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-right tabular-nums text-green-900">
                      ${breakdown.f.net.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-right tabular-nums text-green-900">
                      ${breakdown.f.iva.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-right tabular-nums text-green-900">
                      ${breakdown.f.total.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                )}
                {breakdown.fj.count > 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-2 text-right tabular-nums text-sm text-orange-800">
                      Total FJ ({breakdown.fj.count} | {breakdown.fj.pctCount.toFixed(1)}%)
                    </td>
                    <td className="px-6 py-2 text-center">
                      <span className="text-orange-900 px-1 rounded text-xs">{breakdown.fj.pctAmt.toFixed(1)}%</span>
                    </td>
                    <td colSpan={isFacturado ? 1 : 2}></td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-right tabular-nums text-orange-900">
                      ${breakdown.fj.net.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-right tabular-nums text-orange-900">
                      ${breakdown.fj.iva.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-right tabular-nums text-orange-900">
                      ${breakdown.fj.total.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                )}
                {breakdown.jf.count > 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-2 text-right tabular-nums text-sm text-blue-800">
                      Total JF ({breakdown.jf.count} | {breakdown.jf.pctCount.toFixed(1)}%)
                    </td>
                    <td className="px-6 py-2 text-center">
                      <span className="text-blue-900 px-1 rounded text-xs">{breakdown.jf.pctAmt.toFixed(1)}%</span>
                    </td>
                    <td colSpan={isFacturado ? 1 : 2}></td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-right tabular-nums text-blue-900">
                      ${breakdown.jf.net.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-right tabular-nums text-blue-900">
                      ${breakdown.jf.iva.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-right tabular-nums text-blue-900">
                      ${breakdown.jf.total.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                )}
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
