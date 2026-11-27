"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Lock, Unlock, ArrowLeftRight, History } from 'lucide-react';

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
  currentClosing?: any;
  allClosings?: any[];
  saldoInicialFedeF?: number;
  saldoInicialFedeFJ?: number;
  saldoInicialJuanmaFJ?: number;
  prevClosedMonthLabel?: string;
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
  isJuanma,
  currentClosing,
  allClosings = [],
  saldoInicialFedeF = 0,
  saldoInicialFedeFJ = 0,
  saldoInicialJuanmaFJ = 0,
  prevClosedMonthLabel = ''
}: FinDeMesProps) {

  const ingresosConsolidado = ingresosF + ingresosFJ;
  const resultadoF = ingresosF - gastosF;
  const resultadoFJ = ingresosFJ - gastosFJ;
  const resultadoConsolidado = ingresosConsolidado - gastosConsolidado;

  const [year, month] = targetMonthStr.split('-');
  const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const [viewMode, setViewMode] = useState<'ALL' | 'F' | 'FJ_JF'>('ALL');
  const effectiveIsJuanma = isJuanma || viewMode === 'FJ_JF';
  const hideJuanma = !isJuanma && viewMode === 'F';

  // Separar los retiros de Fede entre Estudio F y Estudio FJ
  const retirosFedeF = useMemo(() => {
    return retirosFedeDetalle
      .filter(r => r.client?.professionalLabel === 'F')
      .reduce((sum, r) => sum + r.finalAmt, 0);
  }, [retirosFedeDetalle]);

  const retirosFedeFJ = useMemo(() => {
    return retirosFedeDetalle
      .filter(r => r.client?.professionalLabel !== 'F')
      .reduce((sum, r) => sum + r.finalAmt, 0);
  }, [retirosFedeDetalle]);

  const effectiveRetirosFedeDetalle = useMemo(() => {
    if (effectiveIsJuanma) {
      return retirosFedeDetalle.filter(r => r.client?.professionalLabel !== 'F');
    }
    if (hideJuanma) {
      return retirosFedeDetalle.filter(r => r.client?.professionalLabel === 'F');
    }
    return retirosFedeDetalle;
  }, [retirosFedeDetalle, effectiveIsJuanma, hideJuanma]);

  const effectiveRetirosFede = useMemo(() => {
    return effectiveRetirosFedeDetalle.reduce((sum, r) => sum + r.finalAmt, 0);
  }, [effectiveRetirosFedeDetalle]);

  // Saldos finales por unidad (para guardar en el Cierre de Mes)
  const saldoFinalFedeF = saldoInicialFedeF + resultadoF - retirosFedeF;
  const saldoFinalFedeFJ = saldoInicialFedeFJ + (resultadoFJ * 0.5) - retirosFedeFJ;
  const saldoFinalJuanmaFJ = saldoInicialJuanmaFJ + (resultadoFJ * 0.5) - retirosJuanma;

  // Valores efectivos según la vista activa (Consolidada / Solo F / Solo FJ)
  const effectiveSaldoInicialFede = effectiveIsJuanma
    ? saldoInicialFedeFJ
    : hideJuanma
      ? saldoInicialFedeF
      : (saldoInicialFedeF + saldoInicialFedeFJ);

  const effectiveResultadoFede = effectiveIsJuanma
    ? (resultadoFJ * 0.5)
    : hideJuanma
      ? resultadoF
      : (resultadoF + resultadoFJ * 0.5);

  const effectiveDisponibleFede = effectiveSaldoInicialFede + effectiveResultadoFede;
  const effectiveSaldoFinalFede = effectiveDisponibleFede - effectiveRetirosFede;
  const effectiveResultadoMesPuroFede = effectiveResultadoFede - effectiveRetirosFede;

  // Cuentas de Juanma (siempre 100% Estudio FJ)
  const juanmaShare = resultadoFJ * 0.5;
  const juanmaDisponible = saldoInicialJuanmaFJ + juanmaShare;
  const juanmaBalance = juanmaDisponible - retirosJuanma;
  const juanmaResultadoMesPuro = juanmaShare - retirosJuanma;

  const isMonthClosed = Boolean(currentClosing?.isClosed);

  const [isIngresosExpanded, setIsIngresosExpanded] = useState(false);
  const [isEgresosExpanded, setIsEgresosExpanded] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showRetirosModal, setShowRetirosModal] = useState<'F' | 'FJ' | null>(null);
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Modal de Compensación entre Socios
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [compDate, setCompDate] = useState(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return todayStr.startsWith(targetMonthStr) ? todayStr : `${targetMonthStr}-28`;
  });
  const [compDirection, setCompDirection] = useState<'JUANMA_TO_FEDE' | 'FEDE_TO_JUANMA'>('JUANMA_TO_FEDE');
  const [compAmount, setCompAmount] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [isSubmittingComp, setIsSubmittingComp] = useState(false);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const formatMoney = (val: number) =>
    `$${Math.abs(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatSignedMoney = (val: number) => {
    if (Math.abs(val) < 0.005) return '$0,00';
    return `${val > 0 ? '+' : '-'}$${Math.abs(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleCloseMonth = async () => {
    if (
      !confirm(
        `¿Confirmás el CIERRE de ${monthName}?\n\n` +
        `• Se bloquearán todos los movimientos (Tesorería, Comprobantes y Abonos) con fecha de ${targetMonthStr}.\n` +
        `• Se trasladarán al mes siguiente los saldos acumulados:\n` +
        `  - Fede (Estudio FJ): ${formatSignedMoney(saldoFinalFedeFJ)}\n` +
        `  - Fede (Consolidado): ${formatSignedMoney(saldoFinalFedeF + saldoFinalFedeFJ)}\n` +
        `  - Juanma (Estudio FJ): ${formatSignedMoney(saldoFinalJuanmaFJ)}`
      )
    ) {
      return;
    }

    setIsSubmittingClose(true);
    try {
      const res = await fetch('/api/reportes/fin-de-mes/cierre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE_MONTH',
          month: targetMonthStr,
          saldoInicialFedeF,
          saldoInicialFedeFJ,
          saldoInicialJuanmaFJ,
          resultadoF,
          resultadoFJ,
          retirosFedeF,
          retirosFedeFJ,
          retirosJuanmaFJ: retirosJuanma,
          saldoFinalFedeF,
          saldoFinalFedeFJ,
          saldoFinalJuanmaFJ
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cerrar el mes');
      alert(`¡Período ${monthName} cerrado exitosamente! Los saldos ya se trasladaron al mes siguiente.`);
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Error al cerrar el mes');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const handleReopenMonth = async () => {
    if (
      !confirm(
        `¿Querés REABRIR el período ${monthName}?\n\n` +
        `Esto desbloqueará la carga/edición de movimientos de ${targetMonthStr}. Recordá volver a apretar "Cerrar Mes" una vez terminados los ajustes para actualizar el saldo que pasa al mes siguiente.`
      )
    ) {
      return;
    }

    setIsSubmittingClose(true);
    try {
      const res = await fetch('/api/reportes/fin-de-mes/cierre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REOPEN_MONTH',
          month: targetMonthStr
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reabrir el mes');
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Error al reabrir el mes');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const handleCompensateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(compAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Ingresá un importe mayor a 0');
      return;
    }

    setIsSubmittingComp(true);
    try {
      const res = await fetch('/api/reportes/fin-de-mes/cierre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPENSATE_PARTNERS',
          date: compDate,
          fromPartner: compDirection,
          amount: amt,
          description: compDesc
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar compensación');
      setIsCompModalOpen(false);
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Error al registrar compensación');
    } finally {
      setIsSubmittingComp(false);
    }
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/reportes" className="text-gray-500 hover:text-indigo-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Cierre de Mes y Socios
            </h1>
            {isMonthClosed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
                <Lock size={13} /> MES CERRADO Y BLOQUEADO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Unlock size={13} /> Período Abierto
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-2 capitalize">
            {monthName}
            {isMonthClosed && currentClosing?.closedAt && (
              <span className="text-xs text-gray-400 ml-2 normal-case">
                (Cerrado el {new Date(currentClosing.closedAt).toLocaleDateString('es-AR')})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!isJuanma && (
            <>
              {!isMonthClosed && (
                <button
                  type="button"
                  onClick={() => {
                    if (juanmaBalance < -1) {
                      setCompDirection('JUANMA_TO_FEDE');
                      setCompAmount(Math.abs(juanmaBalance).toFixed(2));
                    } else if (effectiveSaldoFinalFede < -1) {
                      setCompDirection('FEDE_TO_JUANMA');
                      setCompAmount(Math.abs(effectiveSaldoFinalFede).toFixed(2));
                    } else {
                      setCompAmount('');
                    }
                    setIsCompModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100 transition-colors shadow-sm"
                  title="Registrar devolución o compensación directa entre socios sin alterar la Caja física"
                >
                  <ArrowLeftRight size={14} /> Compensar Socios
                </button>
              )}

              {isMonthClosed ? (
                <button
                  type="button"
                  disabled={isSubmittingClose}
                  onClick={handleReopenMonth}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Unlock size={14} /> {isSubmittingClose ? 'Procesando...' : 'Reabrir Mes'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmittingClose}
                  onClick={handleCloseMonth}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Lock size={14} /> {isSubmittingClose ? 'Cerrando...' : 'Cerrar Mes y Trasladar Saldos'}
                </button>
              )}

              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-700">Vista:</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="rounded-md border border-gray-300 p-2 text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">Consolidada</option>
                  <option value="F">Solo Estudio F</option>
                  <option value="FJ_JF">Solo Estudio FJ (Juanma)</option>
                </select>
              </div>
            </>
          )}
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

      {/* Tarjetas de Cuenta Corriente de Socios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TARJETA FEDE */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Cuenta Corriente Fede</h2>
              <button
                type="button"
                onClick={() => setShowRetirosModal('F')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Ver Mayor / Movimientos →
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200">
                <span className="text-gray-600 font-medium">
                  Saldo Anterior {prevClosedMonthLabel ? `(${prevClosedMonthLabel})` : ''}:
                </span>
                <span className={`font-bold tabular-nums ${effectiveSaldoInicialFede > 0.005 ? 'text-green-700' : effectiveSaldoInicialFede < -0.005 ? 'text-red-700' : 'text-gray-700'}`}>
                  {formatSignedMoney(effectiveSaldoInicialFede)}
                </span>
              </div>

              {!effectiveIsJuanma && (
                <div className="flex justify-between">
                  <span className="text-gray-600">(+) 100% Resultado Estudio F:</span>
                  <span className="font-semibold tabular-nums">${resultadoF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              )}
              {!hideJuanma && (
                <div className="flex justify-between">
                  <span className="text-gray-600">(+) 50% Resultado Estudio FJ:</span>
                  <span className="font-semibold tabular-nums">${(resultadoFJ * 0.5).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold text-indigo-900">
                <span>(=) Total Disponible (Saldo Ant. + Resultado):</span>
                <span className="tabular-nums">{formatSignedMoney(effectiveDisponibleFede)}</span>
              </div>
              <div className="flex justify-between text-red-600 pt-1">
                <span>(-) Retiros / (+) Aportes del Mes:</span>
                <button onClick={() => setShowRetirosModal('F')} className="hover:underline focus:outline-none font-semibold tabular-nums">
                  -${effectiveRetirosFede.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </button>
              </div>
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-lg text-center ${effectiveSaldoFinalFede >= -0.005 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className="text-sm font-bold block">
              {effectiveSaldoFinalFede >= -0.005 ? 'Saldo Final Acumulado a retirar' : 'Saldo Final Acumulado a devolver'}
            </span>
            <span className="text-2xl font-black tabular-nums">
              {formatMoney(effectiveSaldoFinalFede)}
            </span>
            {Math.abs(effectiveSaldoInicialFede) > 0.01 && (
              <span className="block text-[11px] mt-1 opacity-80 font-medium">
                Resultado propio de {monthName} (sin arrastre): {formatSignedMoney(effectiveResultadoMesPuroFede)}
              </span>
            )}
          </div>
        </div>

        {/* TARJETA JUANMA */}
        {!hideJuanma && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-xl font-bold text-gray-800">Cuenta Corriente Juanma</h2>
                <button
                  type="button"
                  onClick={() => setShowRetirosModal('FJ')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Ver Mayor / Movimientos →
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200">
                  <span className="text-gray-600 font-medium">
                    Saldo Anterior {prevClosedMonthLabel ? `(${prevClosedMonthLabel})` : ''}:
                  </span>
                  <span className={`font-bold tabular-nums ${saldoInicialJuanmaFJ > 0.005 ? 'text-green-700' : saldoInicialJuanmaFJ < -0.005 ? 'text-red-700' : 'text-gray-700'}`}>
                    {formatSignedMoney(saldoInicialJuanmaFJ)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">(+) 50% Resultado Estudio FJ:</span>
                  <span className="font-semibold tabular-nums">${juanmaShare.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className={`flex justify-between border-t pt-2 font-bold text-indigo-900 ${!effectiveIsJuanma ? 'mt-[28px]' : ''}`}>
                  <span>(=) Total Disponible (Saldo Ant. + Resultado):</span>
                  <span className="tabular-nums">{formatSignedMoney(juanmaDisponible)}</span>
                </div>
                <div className="flex justify-between text-red-600 pt-1">
                  <span>(-) Retiros / (+) Aportes del Mes:</span>
                  <button onClick={() => setShowRetirosModal('FJ')} className="hover:underline focus:outline-none font-semibold tabular-nums">
                    -${retirosJuanma.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </button>
                </div>
              </div>
            </div>

            <div className={`mt-4 p-3 rounded-lg text-center ${juanmaBalance >= -0.005 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className="text-sm font-bold block">
                {juanmaBalance >= -0.005 ? 'Saldo Final Acumulado a retirar' : 'Saldo Final Acumulado a devolver'}
              </span>
              <span className="text-2xl font-black tabular-nums">
                {formatMoney(juanmaBalance)}
              </span>
              {Math.abs(saldoInicialJuanmaFJ) > 0.01 && (
                <span className="block text-[11px] mt-1 opacity-80 font-medium">
                  Resultado propio de {monthName} (sin arrastre): {formatSignedMoney(juanmaResultadoMesPuro)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Evolución Histórica de Cierres / Cuenta Corriente Mensual */}
      {allClosings.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                Historial de Cierres y Saldos Arrastrados ({effectiveIsJuanma ? 'Estudio FJ' : hideJuanma ? 'Estudio F' : 'Consolidado'})
              </h3>
            </div>
            <span className="text-xs text-indigo-600 font-semibold">
              {isHistoryExpanded ? 'Ocultar ▲' : 'Desplegar ▼'}
            </span>
          </div>
          {isHistoryExpanded && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold uppercase">Período</th>
                    <th className="px-4 py-2.5 text-center font-bold uppercase">Estado</th>
                    <th className="px-4 py-2.5 text-right font-bold uppercase border-l border-gray-200">Fede: Saldo Ant.</th>
                    <th className="px-4 py-2.5 text-right font-bold uppercase">Fede: + Resultado</th>
                    <th className="px-4 py-2.5 text-right font-bold uppercase">Fede: - Retiros</th>
                    <th className="px-4 py-2.5 text-right font-bold uppercase bg-indigo-50 text-indigo-900">Fede: Saldo Final</th>
                    {!hideJuanma && (
                      <>
                        <th className="px-4 py-2.5 text-right font-bold uppercase border-l border-gray-200">Juanma: Saldo Ant.</th>
                        <th className="px-4 py-2.5 text-right font-bold uppercase">Juanma: + Resultado</th>
                        <th className="px-4 py-2.5 text-right font-bold uppercase">Juanma: - Retiros</th>
                        <th className="px-4 py-2.5 text-right font-bold uppercase bg-indigo-50 text-indigo-900">Juanma: Saldo Final</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {allClosings.map((c: any) => {
                    const fInit = effectiveIsJuanma ? c.saldoInicialFedeFJ : hideJuanma ? c.saldoInicialFedeF : (c.saldoInicialFedeF + c.saldoInicialFedeFJ);
                    const fRes = effectiveIsJuanma ? (c.resultadoFJ * 0.5) : hideJuanma ? c.resultadoF : (c.resultadoF + c.resultadoFJ * 0.5);
                    const fRet = effectiveIsJuanma ? c.retirosFedeFJ : hideJuanma ? c.retirosFedeF : (c.retirosFedeF + c.retirosFedeFJ);
                    const fFinal = effectiveIsJuanma ? c.saldoFinalFedeFJ : hideJuanma ? c.saldoFinalFedeF : (c.saldoFinalFedeF + c.saldoFinalFedeFJ);

                    const jInit = c.saldoInicialJuanmaFJ;
                    const jRes = c.resultadoFJ * 0.5;
                    const jRet = c.retirosJuanmaFJ;
                    const jFinal = c.saldoFinalJuanmaFJ;

                    return (
                      <tr key={c.id} className={`hover:bg-gray-50 ${c.month === targetMonthStr ? 'bg-indigo-50/30 font-semibold' : ''}`}>
                        <td className="px-4 py-2.5 whitespace-nowrap font-bold text-gray-900">
                          <a href={`/reportes/fin-de-mes?month=${c.month}`} className="text-indigo-600 hover:underline">
                            {c.month}
                          </a>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-center">
                          {c.isClosed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                              🔒 Cerrado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Abierto
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums border-l border-gray-100">{formatSignedMoney(fInit)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums text-green-700">+${fRes.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums text-red-600">-${fRet.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className={`px-4 py-2.5 whitespace-nowrap text-right tabular-nums font-bold bg-indigo-50/40 ${fFinal >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                          {formatSignedMoney(fFinal)}
                        </td>
                        {!hideJuanma && (
                          <>
                            <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums border-l border-gray-100">{formatSignedMoney(jInit)}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums text-green-700">+${jRes.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums text-red-600">-${jRet.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className={`px-4 py-2.5 whitespace-nowrap text-right tabular-nums font-bold bg-indigo-50/40 ${jFinal >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                              {formatSignedMoney(jFinal)}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
              {!effectiveIsJuanma && <th className="px-6 py-4 text-right tabular-nums text-xs font-bold uppercase tracking-wider border-l border-gray-600 bg-[#166534]">Estudio F</th>}
              {!hideJuanma && <th className={`px-6 py-4 text-right tabular-nums text-xs font-bold uppercase tracking-wider border-l border-gray-600 ${effectiveIsJuanma ? 'bg-[#1f2937]' : 'bg-[#9a3412]'}`}>Estudio FJ</th>}
              <th className="px-6 py-4 text-right tabular-nums text-xs font-bold uppercase tracking-wider border-l border-gray-600">Consolidado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Ingresos Main Row */}
            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setIsIngresosExpanded(!isIngresosExpanded)}>
              <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                <svg className={`h-4 w-4 transform transition-transform ${isIngresosExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Ingresos (Cobranzas)
              </td>
              {!effectiveIsJuanma && <td className="px-6 py-4 text-right tabular-nums text-[#15803d] font-bold border-l border-gray-200">${ingresosF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
              {!hideJuanma && <td className="px-6 py-4 text-right tabular-nums text-[#c2410c] font-bold border-l border-gray-200">${ingresosFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
              <td className="px-6 py-4 text-right tabular-nums text-[#1e1b4b] font-bold border-l border-gray-200">{effectiveIsJuanma || hideJuanma ? '-' : `$${ingresosConsolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</td>
            </tr>
            {/* Ingresos Details */}
            {isIngresosExpanded && groupedIngresos.map((g, i) => {
              if (effectiveIsJuanma && g.FJ === 0) return null;
              if (hideJuanma && g.F === 0) return null;
              return (
                <tr key={`ing-${i}`} className="bg-gray-50">
                  <td className="px-10 py-2 text-sm text-gray-500 pl-[3.5rem]">{g.clientName}</td>
                  {!effectiveIsJuanma && <td className="px-6 py-2 text-right tabular-nums text-sm text-green-700 border-l border-gray-200">${g.F.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                  {!hideJuanma && <td className="px-6 py-2 text-right tabular-nums text-sm text-orange-700 border-l border-gray-200">${g.FJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                  <td className="px-6 py-2 text-right tabular-nums text-sm text-gray-700 font-medium border-l border-gray-200">{effectiveIsJuanma || hideJuanma ? '-' : `$${g.Consolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</td>
                </tr>
              );
            })}

            {/* Gastos Main Row */}
            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setIsEgresosExpanded(!isEgresosExpanded)}>
              <td className="px-6 py-4 font-bold text-[#991b1b] flex items-center gap-2">
                <svg className={`h-4 w-4 transform transition-transform ${isEgresosExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Egresos Operativos
              </td>
              {!effectiveIsJuanma && <td className="px-6 py-4 text-right tabular-nums text-[#dc2626] font-bold border-l border-gray-200">-${gastosF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
              {!hideJuanma && <td className="px-6 py-4 text-right tabular-nums text-[#dc2626] font-bold border-l border-gray-200">-${gastosFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
              <td className="px-6 py-4 text-right tabular-nums text-[#dc2626] font-bold border-l border-gray-200">{effectiveIsJuanma || hideJuanma ? '-' : `-$${gastosConsolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</td>
            </tr>
            {/* Gastos Details */}
            {isEgresosExpanded && groupedEgresos.map((g, i) => {
              if (effectiveIsJuanma && g.FJ === 0) return null;
              if (hideJuanma && g.F === 0) return null;
              return (
                <React.Fragment key={`egr-${i}`}>
                  <tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleCategory(g.category)}>
                    <td className="px-10 py-2 text-sm text-gray-500 pl-[2rem] flex items-center gap-1">
                      <svg className={`h-3 w-3 transform transition-transform ${expandedCategories[g.category] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      {g.category}
                    </td>
                    {!effectiveIsJuanma && <td className="px-6 py-2 text-right tabular-nums text-sm text-red-500 border-l border-gray-200">-${g.F.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                    {!hideJuanma && <td className="px-6 py-2 text-right tabular-nums text-sm text-red-500 border-l border-gray-200">-${g.FJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                    <td className="px-6 py-2 text-right tabular-nums text-sm text-gray-700 font-medium border-l border-gray-200">{effectiveIsJuanma || hideJuanma ? '-' : `-$${g.Consolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</td>
                  </tr>
                  {expandedCategories[g.category] && g.details.map((d, di) => {
                    if (effectiveIsJuanma && (d.amtFJ || 0) === 0) return null;
                    if (hideJuanma && (d.amtF || 0) === 0) return null;
                    return (
                      <tr key={`egr-det-${i}-${di}`} className="bg-white">
                        <td className="px-10 py-1.5 text-xs text-gray-400 pl-[3.5rem]">
                          {new Date(d.date).toLocaleDateString('es-AR')} - {d.description || 'Sin detalle'} {d.clientName ? `(${d.clientName})` : ''}
                        </td>
                        {!effectiveIsJuanma && <td className="px-6 py-1.5 text-right tabular-nums text-xs text-red-300 border-l border-gray-200">{d.amtF > 0 ? `-$${d.amtF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}</td>}
                        {!hideJuanma && <td className="px-6 py-1.5 text-right tabular-nums text-xs text-red-300 border-l border-gray-200">{d.amtFJ > 0 ? `-$${d.amtFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}</td>}
                        <td className="px-6 py-1.5 text-right tabular-nums text-xs text-gray-300 border-l border-gray-200">{effectiveIsJuanma || hideJuanma ? '-' : `-$${d.amtTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-black text-lg">
            <tr className="bg-[#f8fafc] border-t-2 border-gray-300">
              <td className="px-6 py-5 text-gray-900 font-bold uppercase text-sm">Resultado Neto</td>
              {!effectiveIsJuanma && <td className="px-6 py-5 text-right tabular-nums font-bold border-l border-gray-300 text-[#15803d]">${resultadoF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
              {!hideJuanma && <td className="px-6 py-5 text-right tabular-nums font-bold border-l border-gray-300 text-[#c2410c]">${resultadoFJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
              <td className="px-6 py-5 text-right tabular-nums font-bold border-l border-gray-300 text-[#1e1b4b]">{effectiveIsJuanma || hideJuanma ? '-' : `$${resultadoConsolidado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal Mayor de Cuenta Corriente del Socio (con Saldo Corrido) */}
      {showRetirosModal && (() => {
        const isFedeModal = showRetirosModal === 'F';
        const partnerName = isFedeModal ? 'Fede' : 'Juanma';
        const initialBal = isFedeModal ? effectiveSaldoInicialFede : saldoInicialJuanmaFJ;
        const resultCredit = isFedeModal ? effectiveResultadoFede : juanmaShare;
        const list = isFedeModal ? effectiveRetirosFedeDetalle : retirosJuanmaDetalle;

        let running = initialBal + resultCredit;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Mayor de Cuenta Corriente — {partnerName}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {monthName} ({effectiveIsJuanma ? 'Vista Estudio FJ' : hideJuanma ? 'Vista Estudio F' : 'Vista Consolidada'})
                  </p>
                </div>
                <button onClick={() => setShowRetirosModal(null)} className="text-gray-500 hover:text-gray-800">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-4 overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase">Fecha</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase">Concepto / Detalle</th>
                      <th className="px-3 py-2 text-right font-bold text-gray-500 uppercase">Retiro (Debe)</th>
                      <th className="px-3 py-2 text-right font-bold text-gray-500 uppercase">Acreditación (Haber)</th>
                      <th className="px-3 py-2 text-right font-bold text-gray-700 uppercase">Saldo Socio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-3 py-2 text-gray-500">Inicio</td>
                      <td className="px-3 py-2 text-gray-800">Saldo Anterior Acumulado {prevClosedMonthLabel ? `(${prevClosedMonthLabel})` : ''}</td>
                      <td className="px-3 py-2 text-right tabular-nums">-</td>
                      <td className="px-3 py-2 text-right tabular-nums">-</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-bold ${initialBal >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {formatSignedMoney(initialBal)}
                      </td>
                    </tr>
                    <tr className="bg-indigo-50/40 font-semibold">
                      <td className="px-3 py-2 text-gray-500">{targetMonthStr}</td>
                      <td className="px-3 py-2 text-indigo-900">Acreditación Resultado Neto del Mes</td>
                      <td className="px-3 py-2 text-right tabular-nums">-</td>
                      <td className="px-3 py-2 text-right tabular-nums text-green-700">
                        +${resultCredit.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums font-bold ${(initialBal + resultCredit) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {formatSignedMoney(initialBal + resultCredit)}
                      </td>
                    </tr>
                    {list.map(r => {
                      let description = r.description || '-';
                      if (description.includes('Retiro automático s/ cobro') && r.client?.name) {
                        description = `Retiro aut. (Cobro ${r.client.name})`;
                      }
                      // r.finalAmt > 0 es un retiro (resta del saldo del socio); r.finalAmt < 0 es un aporte/reintegro (suma al saldo del socio)
                      running -= r.finalAmt;
                      const isWithdrawal = r.finalAmt > 0;

                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{new Date(r.date).toLocaleDateString('es-AR')}</td>
                          <td className="px-3 py-2 text-gray-900" title={r.description}>{description}</td>
                          <td className="px-3 py-2 font-semibold text-right tabular-nums text-red-600">
                            {isWithdrawal ? `-$${Math.abs(r.finalAmt).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className="px-3 py-2 font-semibold text-right tabular-nums text-green-700">
                            {!isWithdrawal ? `+$${Math.abs(r.finalAmt).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className={`px-3 py-2 font-bold text-right tabular-nums ${running >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {formatSignedMoney(running)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300 text-xs">
                    <tr>
                      <td colSpan={2} className="px-3 py-3 text-right text-gray-900">Totales y Saldo Final Acumulado:</td>
                      <td className="px-3 py-3 text-right tabular-nums text-red-700">
                        -${list.filter(r => r.finalAmt > 0).reduce((acc, r) => acc + r.finalAmt, 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-green-700">
                        +${(resultCredit + list.filter(r => r.finalAmt < 0).reduce((acc, r) => acc + Math.abs(r.finalAmt), 0)).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className={`px-3 py-3 text-right tabular-nums text-sm font-black ${running >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                        {formatSignedMoney(running)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Compensación Directa entre Socios */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Compensar Saldos entre Socios</h3>
              <button onClick={() => setIsCompModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Registrá una transferencia o devolución directa entre las cuentas personales de los socios. Esto acreditará un <b>Aporte/Reintegro</b> al socio que paga y un <b>Retiro</b> al socio que cobra, dejando el saldo de la <b>Caja física del estudio sin cambios ($0 neto)</b>.
            </p>
            <form onSubmit={handleCompensateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sentido de la compensación</label>
                <select
                  value={compDirection}
                  onChange={e => setCompDirection(e.target.value as any)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                >
                  <option value="JUANMA_TO_FEDE">Juanma transfiere / devuelve a Fede</option>
                  <option value="FEDE_TO_JUANMA">Fede transfiere / devuelve a Juanma</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={compDate}
                    onChange={e => setCompDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Importe ($)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={compAmount}
                    onChange={e => setCompAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm font-bold text-indigo-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Detalle / Observación (Opcional)</label>
                <input
                  type="text"
                  value={compDesc}
                  onChange={e => setCompDesc(e.target.value)}
                  placeholder="Ej: Transferencia personal ajuste cierre..."
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComp}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmittingComp ? 'Registrando...' : 'Confirmar Compensación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
