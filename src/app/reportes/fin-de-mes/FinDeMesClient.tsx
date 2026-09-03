"use client";

import React from 'react';
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
  alertasParticipacion: any[];
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
  alertasParticipacion
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <span>-${retirosFede.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
          <div className={`mt-4 p-3 rounded-lg text-center ${fedeBalance > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className="text-sm font-bold block">{fedeBalance > 0 ? 'Saldo a retirar' : 'Debe devolver'}</span>
            <span className="text-2xl font-black">${Math.abs(fedeBalance).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>

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
              <span>-${retirosJuanma.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Concepto</th>
              <th className="px-6 py-4 text-right tabular-nums text-sm font-semibold uppercase tracking-wider border-l border-gray-600 bg-green-900">Estudio F</th>
              <th className="px-6 py-4 text-right tabular-nums text-sm font-semibold uppercase tracking-wider border-l border-gray-600 bg-orange-900">Estudio FJ</th>
              <th className="px-6 py-4 text-right tabular-nums text-sm font-semibold uppercase tracking-wider border-l border-gray-600">Consolidado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Ingresos */}
            <tr className="bg-gray-50">
              <td className="px-6 py-3 font-bold text-gray-900">Ingresos (Cobranzas)</td>
              <td className="px-6 py-3 text-right tabular-nums text-green-700 font-bold border-l border-gray-200">${ingresosF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td className="px-6 py-3 text-right tabular-nums text-orange-700 font-bold border-l border-gray-200">${ingresosFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td className="px-6 py-3 text-right tabular-nums text-gray-900 font-bold border-l border-gray-200">${ingresosConsolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
            {/* Gastos */}
            <tr>
              <td className="px-6 py-3 font-bold text-red-800">Egresos Operativos</td>
              <td className="px-6 py-3 text-right tabular-nums text-red-600 border-l border-gray-200">-${gastosF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td className="px-6 py-3 text-right tabular-nums text-red-600 border-l border-gray-200">-${gastosFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td className="px-6 py-3 text-right tabular-nums text-red-600 font-bold border-l border-gray-200">-${gastosConsolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
          </tbody>
          <tfoot className="bg-gray-100 font-black text-lg">
            <tr>
              <td className="px-6 py-4 text-gray-900">Resultado Neto</td>
              <td className="px-6 py-4 text-right tabular-nums border-l border-gray-300 text-green-900">${resultadoF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td className="px-6 py-4 text-right tabular-nums border-l border-gray-300 text-orange-900">${resultadoFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td className="px-6 py-4 text-right tabular-nums border-l border-gray-300 text-indigo-900">${resultadoConsolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div id="gastos" className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Detalle de Egresos Operativos</h3>
        {gastosDetalle.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay egresos registrados este mes.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Categoría</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Detalle</th>
                <th className="px-4 py-2 text-right tabular-nums font-medium text-gray-500">Asignación</th>
                <th className="px-4 py-2 text-right tabular-nums font-medium text-gray-500">Importe Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gastosDetalle.map(g => (
                <tr key={g.id}>
                  <td className="px-4 py-2 text-gray-600">{new Date(g.date).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{g.category}</td>
                  <td className="px-4 py-2 text-gray-600">{g.description || '-'}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {g.assignedTo === 'PRORRATEO' ? (
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">Prorrateo</span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs ${g.assignedTo === 'F' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        100% a {g.assignedTo}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-bold text-red-700">
                    ${g.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
