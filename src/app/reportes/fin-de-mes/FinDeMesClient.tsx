"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

type FinDeMesProps = {
  targetMonthStr: string;
  propF: number;
  propFJ: number;
  ingresosF: number;
  ingresosFJ: number;
  gastosF: number;
  gastosFJ: number;
  gastosConsolidado: number;
  retirosFede: number;
  retirosJuanma: number;
  gastosDetalle: any[];
  ingresosDetalle: any[];
  retirosFedeDetalle: any[];
  retirosJuanmaDetalle: any[];
  alertasParticipacion: any[];
  isJuanma?: boolean;
};

export default function FinDeMesClient({
  targetMonthStr,
  propF,
  propFJ,
  ingresosF,
  ingresosFJ,
  gastosF,
  gastosFJ,
  gastosConsolidado,
  retirosFede,
  retirosJuanma,
  gastosDetalle,
  ingresosDetalle,
  retirosFedeDetalle,
  retirosJuanmaDetalle,
  alertasParticipacion,
  isJuanma
}: FinDeMesProps) {

  const ingresosConsolidado = ingresosF + ingresosFJ;
  const resultadoF = ingresosF - gastosF;
  const resultadoFJ = ingresosFJ - gastosFJ;
  const resultadoConsolidado = ingresosConsolidado - gastosConsolidado;

  // Cuentas de Socios
  const juanmaShare = resultadoFJ * 0.5;
  const juanmaBalance = juanmaShare - retirosJuanma;

  const fedeShare = resultadoF + (resultadoFJ * 0.5);
  const fedeBalance = fedeShare - retirosFede;

  const [year, month] = targetMonthStr.split('-');
  const monthName = new Date(parseInt(year), parseInt(month)-1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const [isIngresosExpanded, setIsIngresosExpanded] = useState(false);
  const [isEgresosExpanded, setIsEgresosExpanded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showRetirosModal, setShowRetirosModal] = useState<'F' | 'FJ' | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const groupedEgresos = useMemo(() => {
    const groups: Record<string, { category: string; F: number; FJ: number; Consolidado: number; details: any[] }> = {};
    gastosDetalle.forEach(g => {
      if (!groups[g.category]) groups[g.category] = { category: g.category, F: 0, FJ: 0, Consolidado: 0, details: [] };
      
      let amtF = g.amtF || 0;
      let amtFJ = g.amtFJ || 0;
      let amtTotal = g.type === 'EXPENSE' ? Math.abs(g.amount) : -Math.abs(g.amount);
      
      if (g.assignedTo === 'F') {
        amtF = amtTotal;
        amtFJ = 0;
      } else if (g.assignedTo === 'FJ') {
        amtF = 0;
        amtFJ = amtTotal;
      }

      groups[g.category].F += amtF;
      groups[g.category].FJ += amtFJ;
      groups[g.category].Consolidado += amtTotal;
      groups[g.category].details.push({
        ...g,
        amtF,
        amtFJ,
        amtTotal
      });
    });
    return Object.values(groups).sort((a, b) => b.Consolidado - a.Consolidado);
  }, [gastosDetalle]);

  const groupedIngresos = useMemo(() => {
    const groups: Record<string, { clientName: string; F: number; FJ: number; Consolidado: number }> = {};
    ingresosDetalle.forEach(i => {
      const name = i.client?.name || 'Varios / Sin Cliente';
      if (!groups[name]) groups[name] = { clientName: name, F: 0, FJ: 0, Consolidado: 0 };
      
      const amt = i.netAmount || i.amount;
      const isF = i.client?.professionalLabel === 'F';
      const isFJ = i.client?.professionalLabel === 'FJ' || i.client?.professionalLabel === 'JF';
      
      if (isF) groups[name].F += amt;
      if (isFJ) groups[name].FJ += amt;
      groups[name].Consolidado += amt;
    });
    return Object.values(groups).sort((a, b) => b.Consolidado - a.Consolidado);
  }, [ingresosDetalle]);

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
              Cierre de Mes y Socios
            </h1>
          </div>
          <p className="text-gray-600 mt-2 capitalize">{monthName}</p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="month" 
            value={targetMonthStr}
            onChange={(e) => {
              if (e.target.value) {
                window.location.href = `/reportes/fin-de-mes?month=${e.target.value}`;
              }
            }}
            className="rounded-md border border-gray-300 p-2 text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {alertasParticipacion.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <div className="flex items-center mb-2">
            <span className="text-red-800 font-bold text-lg">⚠️ Alertas de Participación a Pagar</span>
          </div>
          <p className="text-sm text-red-700 mb-3">Se han cobrado facturas que incluían participaciones. Recordá liquidar a los colaboradores:</p>
          <ul className="space-y-2">
            {alertasParticipacion.map((a, i) => (
              <li key={i} className="text-sm bg-white p-2 rounded border border-red-200 shadow-sm flex justify-between">
                <div>
                  <span className="font-bold text-gray-900">{a.collaboratorName}</span> 
                  <span className="text-gray-600"> (Por cliente {a.clientName} - {a.chargeDesc})</span>
                </div>
                <div className="font-bold text-red-700">
                  ${a.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tarjetas de Socios */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isJuanma ? 'md:grid-cols-1' : ''}`}>
        {!isJuanma && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Liquidación Fede</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">100% Resultado Estudio F:</span>
                <span className="font-semibold">${resultadoF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">50% Resultado Estudio FJ:</span>
                <span className="font-semibold">${(resultadoFJ * 0.5).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-indigo-900">
                <span>Total a Distribuir:</span>
                <span>${fedeShare.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-red-600 pt-2">
                <span>(-) Retiros Fede:</span>
                <button onClick={() => setShowRetirosModal('F')} className="hover:underline focus:outline-none">
                  -${retirosFede.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </button>
              </div>
            </div>
            <div className={`mt-4 p-3 rounded-lg text-center ${fedeBalance > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className="text-sm font-bold block">{fedeBalance > 0 ? 'Saldo a retirar' : 'Debe devolver'}</span>
              <span className="text-2xl font-black">${Math.abs(fedeBalance).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Liquidación Juanma</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">50% Resultado Estudio FJ:</span>
              <span className="font-semibold">${juanmaShare.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold text-indigo-900 mt-[26px]">
              <span>Total a Distribuir:</span>
              <span>${juanmaShare.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-red-600 pt-2">
              <span>(-) Retiros Juanma:</span>
              <button onClick={() => setShowRetirosModal('FJ')} className="hover:underline focus:outline-none">
                -${retirosJuanma.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </button>
            </div>
          </div>
          <div className={`mt-4 p-3 rounded-lg text-center ${juanmaBalance > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className="text-sm font-bold block">{juanmaBalance > 0 ? 'Saldo a retirar' : 'Debe devolver'}</span>
            <span className="text-2xl font-black">${Math.abs(juanmaBalance).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      {/* P&L */}
      <h2 className="text-2xl font-bold mt-8 mb-4">Estado de Resultados (P&L)</h2>
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6 border border-blue-200">
        <strong>Prorrateo de Gastos:</strong> Los gastos comunes de este mes se dividen en base a la facturación de abonos del mes pasado. 
        Este mes, el coeficiente es <strong>{(propF * 100).toFixed(1)}% para F</strong> y <strong>{(propFJ * 100).toFixed(1)}% para FJ</strong>.
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#1f2937] text-white">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Concepto</th>
              {!isJuanma && <th className="px-6 py-4 text-right tabular-nums text-xs font-bold uppercase tracking-wider border-l border-gray-600 bg-[#166534]">Estudio F</th>}
              <th className={`px-6 py-4 text-right tabular-nums text-xs font-bold uppercase tracking-wider border-l border-gray-600 ${isJuanma ? 'bg-[#1f2937]' : 'bg-[#9a3412]'}`}>Estudio FJ</th>
              {!isJuanma && <th className="px-6 py-4 text-right tabular-nums text-xs font-bold uppercase tracking-wider border-l border-gray-600">Consolidado</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Ingresos Main Row */}
            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setIsIngresosExpanded(!isIngresosExpanded)}>
              <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                <svg className={`h-4 w-4 transform transition-transform ${isIngresosExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Ingresos (Cobranzas)
              </td>
              {!isJuanma && <td className="px-6 py-4 text-right tabular-nums text-[#15803d] font-bold border-l border-gray-200">${ingresosF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
              <td className="px-6 py-4 text-right tabular-nums text-[#c2410c] font-bold border-l border-gray-200">${ingresosFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              {!isJuanma && <td className="px-6 py-4 text-right tabular-nums text-[#1e1b4b] font-bold border-l border-gray-200">${ingresosConsolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
            </tr>
            {/* Ingresos Details */}
            {isIngresosExpanded && groupedIngresos.map((g, i) => {
              if (isJuanma && g.FJ === 0) return null; // Hide rows with 0 FJ income if Juanma
              return (
                <tr key={`ing-${i}`} className="bg-gray-50">
                  <td className="px-10 py-2 text-sm text-gray-500 pl-[3.5rem]">{g.clientName}</td>
                  {!isJuanma && <td className="px-6 py-2 text-right tabular-nums text-sm text-green-700 border-l border-gray-200">${g.F.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                  <td className="px-6 py-2 text-right tabular-nums text-sm text-orange-700 border-l border-gray-200">${g.FJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  {!isJuanma && <td className="px-6 py-2 text-right tabular-nums text-sm text-gray-700 font-medium border-l border-gray-200">${g.Consolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                </tr>
              );
            })}

            {/* Gastos Main Row */}
            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setIsEgresosExpanded(!isEgresosExpanded)}>
              <td className="px-6 py-4 font-bold text-[#991b1b] flex items-center gap-2">
                <svg className={`h-4 w-4 transform transition-transform ${isEgresosExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Egresos Operativos
              </td>
              {!isJuanma && <td className="px-6 py-4 text-right tabular-nums text-[#dc2626] font-bold border-l border-gray-200">-${gastosF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
              <td className="px-6 py-4 text-right tabular-nums text-[#dc2626] font-bold border-l border-gray-200">-${gastosFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              {!isJuanma && <td className="px-6 py-4 text-right tabular-nums text-[#dc2626] font-bold border-l border-gray-200">-${gastosConsolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
            </tr>
            {/* Gastos Details */}
            {isEgresosExpanded && groupedEgresos.map((g, i) => {
              if (isJuanma && g.FJ === 0) return null; // Hide rows with 0 FJ expense if Juanma
              return (
                <React.Fragment key={`egr-${i}`}>
                  <tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleCategory(g.category)}>
                    <td className="px-10 py-2 text-sm text-gray-600 pl-[3.5rem] flex items-center gap-2">
                      <svg className={`h-3 w-3 transform transition-transform ${expandedCategories[g.category] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      {g.category}
                    </td>
                    {!isJuanma && <td className="px-6 py-2 text-right tabular-nums text-sm text-red-500 border-l border-gray-200">-${g.F.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                    <td className="px-6 py-2 text-right tabular-nums text-sm text-red-500 border-l border-gray-200">-${g.FJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    {!isJuanma && <td className="px-6 py-2 text-right tabular-nums text-sm text-red-600 font-medium border-l border-gray-200">-${g.Consolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                  </tr>
                  {/* Nested Detail for Category */}
                  {expandedCategories[g.category] && g.details.map(d => {
                    if (isJuanma && (d.amtFJ || 0) === 0) return null;
                    return (
                      <tr key={d.id} className="bg-white">
                        <td className="px-10 py-1.5 text-xs text-gray-400 pl-[5rem] italic truncate max-w-[200px]" title={d.description || 'Sin detalle'}>
                          {d.description || 'Sin detalle'} ({new Date(d.date).toLocaleDateString('es-AR')})
                        </td>
                        {!isJuanma && <td className="px-6 py-1.5 text-right tabular-nums text-xs text-red-300 border-l border-gray-200">{d.amtF > 0 ? `-$${d.amtF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}</td>}
                        <td className="px-6 py-1.5 text-right tabular-nums text-xs text-red-300 border-l border-gray-200">{d.amtFJ > 0 ? `-$${d.amtFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}</td>
                        {!isJuanma && <td className="px-6 py-1.5 text-right tabular-nums text-xs text-red-400 border-l border-gray-200">-${d.amtTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-black text-lg">
            <tr>
              <td className="px-6 py-5 text-gray-900">Resultado Neto</td>
              {!isJuanma && <td className="px-6 py-5 text-right tabular-nums border-l border-gray-300 text-[#15803d]">${resultadoF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
              <td className="px-6 py-5 text-right tabular-nums border-l border-gray-300 text-[#7c2d12]">${resultadoFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              {!isJuanma && <td className="px-6 py-5 text-right tabular-nums border-l border-gray-300 text-[#1e1b4b]">${resultadoConsolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {showRetirosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Detalle de Retiros {showRetirosModal === 'F' ? 'Fede' : 'Juanma'}</h3>
              <button onClick={() => setShowRetirosModal(null)} className="text-gray-500 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {(showRetirosModal === 'F' ? retirosFedeDetalle : retirosJuanmaDetalle).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay retiros registrados este mes.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(showRetirosModal === 'F' ? retirosFedeDetalle : retirosJuanmaDetalle).map(r => {
                      let description = r.description || '-';
                      if (description.includes('Retiro automático s/ cobro') && r.client?.name) {
                        description = `Retiro aut. (Cobro ${r.client.name})`;
                      }

                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-600">{new Date(r.date).toLocaleDateString('es-AR')}</td>
                          <td className="px-4 py-2 text-sm text-gray-900" title={r.description}>{description}</td>
                          <td className={`px-4 py-2 text-sm font-bold text-right tabular-nums ${r.finalAmt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {r.finalAmt > 0 ? '-' : '+'}${Math.abs(r.finalAmt).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-right text-gray-900">Total Retiros:</td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-700">
                        -${(showRetirosModal === 'F' ? retirosFedeDetalle : retirosJuanmaDetalle).reduce((acc, r) => acc + r.finalAmt, 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
