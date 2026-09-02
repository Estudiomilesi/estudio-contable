"use client";

import { useState, useEffect, useMemo } from 'react';

type PaymentApplication = {
  id: string;
  amount: number;
};

type Transaction = {
  id: string;
  date: string;
  type: 'CHARGE' | 'PAYMENT';
  amount: number;
  description: string;
  runningBalance: number;
  paymentsApplied?: PaymentApplication[];
  chargesCovered?: PaymentApplication[];
};

type ClientWithBalance = {
  id: string;
  code: string;
  name: string;
  professionalLabel: string;
  balance: number;
  unappliedPayments: number;
  unpaidCharges: number;
  transactions: Transaction[];
};

export default function CuentasCorrientesPage() {
  const [clientes, setClientes] = useState<ClientWithBalance[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'ALL' | 'PENDING'>('ALL');

  // Application Modal state
  const [applyingPayment, setApplyingPayment] = useState<Transaction | null>(null);
  const [targetChargeId, setTargetChargeId] = useState<string>('');
  const [applyAmount, setApplyAmount] = useState<string>('');

  const [sortConfig, setSortConfig] = useState<{ key: keyof ClientWithBalance, direction: 'asc' | 'desc' } | null>({ key: 'code', direction: 'asc' });
  const [filterLabel, setFilterLabel] = useState<string>('ALL');

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cuentas-corrientes');
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredAndSortedClientes = useMemo(() => {
    let result = [...clientes];
    
    if (filterLabel !== 'ALL') {
      result = result.filter(c => c.professionalLabel === filterLabel);
    }

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];
        
        if (sortConfig.key === 'code' || sortConfig.key === 'balance') {
          const aNum = parseFloat(aValue as string);
          const bNum = parseFloat(bValue as string);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            aValue = aNum;
            bValue = bNum;
          }
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue as string).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [clientes, sortConfig, filterLabel]);

  const requestSort = (key: keyof ClientWithBalance) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const listTotals = useMemo(() => {
    let debt = 0; // Lo que nos deben
    let credit = 0; // Lo que debemos
    filteredAndSortedClientes.forEach(c => {
      if (c.balance > 0) debt += c.balance;
      else if (c.balance < 0) credit += Math.abs(c.balance);
    });
    return { debt, credit, total: debt - credit };
  }, [filteredAndSortedClientes]);

  const selectedClient = useMemo(() => {
    return clientes.find(c => c.id === selectedClientId) || null;
  }, [clientes, selectedClientId]);

  // Helpers to calculate applied amounts on the fly
  const getAppliedAmount = (tx: Transaction) => {
    if (tx.type === 'CHARGE' && tx.paymentsApplied) {
      return tx.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
    }
    if (tx.type === 'PAYMENT' && tx.chargesCovered) {
      return tx.chargesCovered.reduce((sum, app) => sum + app.amount, 0);
    }
    return 0;
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingPayment || !targetChargeId || !applyAmount) return;

    try {
      const res = await fetch('/api/cuentas-corrientes/aplicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: applyingPayment.id,
          chargeId: targetChargeId,
          amount: parseFloat(applyAmount)
        })
      });

      if (res.ok) {
        setApplyingPayment(null);
        setTargetChargeId('');
        setApplyAmount('');
        fetchClientes(); // refresh data
      } else {
        alert('Error al aplicar el pago');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openApplyModal = (payment: Transaction) => {
    setApplyingPayment(payment);
    const unapplied = payment.amount - getAppliedAmount(payment);
    setApplyAmount(unapplied.toString());
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Columna Izquierda: Lista de clientes */}
      <div className="w-1/3 flex flex-col border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-y-auto flex-1 p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th colSpan={4} className="px-3 py-3 border-b border-gray-200 bg-gray-50 text-left text-lg font-bold text-gray-800">
                  Cuentas Corrientes
                </th>
              </tr>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200" onClick={() => requestSort('code')}>
                  Cód
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200" onClick={() => requestSort('name')}>
                  Cliente
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase">
                  <div className="flex items-center justify-center gap-1">
                    <span className="cursor-pointer hover:bg-gray-200 px-1 rounded" onClick={() => requestSort('professionalLabel')}>Etiq</span>
                    <select 
                      value={filterLabel} 
                      onChange={e => setFilterLabel(e.target.value)}
                      className="text-[10px] border-gray-300 rounded focus:ring-indigo-500 font-normal p-0 h-4"
                    >
                      <option value="ALL">Todas</option>
                      <option value="F">F</option>
                      <option value="FJ">FJ</option>
                      <option value="JF">JF</option>
                    </select>
                  </div>
                </th>
                <th className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200" onClick={() => requestSort('balance')}>
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Cargando...</td></tr>
              ) : filteredAndSortedClientes.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No hay clientes.</td></tr>
              ) : (
                filteredAndSortedClientes.map(c => (
                  <tr 
                    key={c.id} 
                    onClick={() => setSelectedClientId(c.id)}
                    className={`cursor-pointer hover:bg-indigo-50 transition-colors ${selectedClientId === c.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                  >
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {c.code}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 font-medium truncate max-w-[150px]" title={c.name}>
                      {c.name}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        c.professionalLabel === 'F' ? 'bg-green-200 text-green-900' : 
                        c.professionalLabel === 'FJ' ? 'bg-orange-200 text-orange-900' : 
                        'bg-blue-200 text-blue-900'
                      }`}>
                        {c.professionalLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className={`text-sm font-bold ${c.balance > 0 ? 'text-red-700' : c.balance < 0 ? 'text-green-700' : 'text-gray-700'}`}>
                        ${Math.abs(c.balance).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-bold sticky bottom-0 z-10 border-t-2 border-gray-300 text-xs">
              <tr>
                <td colSpan={3} className="px-3 py-1 text-right text-red-800">A Cobrar</td>
                <td className="px-3 py-1 text-right text-red-900">${listTotals.debt.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-3 py-1 text-right text-green-800">Saldos a Favor</td>
                <td className="px-3 py-1 text-right text-green-900">${listTotals.credit.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-3 py-1.5 text-right text-gray-800 border-t border-gray-300">Total Neto</td>
                <td className={`px-3 py-1.5 text-right border-t border-gray-300 ${listTotals.total > 0 ? 'text-red-900' : listTotals.total < 0 ? 'text-green-900' : 'text-gray-900'}`}>
                  ${Math.abs(listTotals.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Columna Derecha: Detalle del cliente y movimientos */}
      <div className="w-2/3 flex flex-col border rounded-xl bg-white shadow-sm overflow-hidden relative">
        {selectedClient ? (
          <>
            <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                <p className="text-sm text-gray-700 mt-1">
                  Pagos sin aplicar: <span className="font-semibold text-green-700">${selectedClient.unappliedPayments.toLocaleString('es-AR')}</span> | 
                  Cargos impagos: <span className="font-semibold text-red-700">${selectedClient.unpaidCharges.toLocaleString('es-AR')}</span>
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-black mb-2 ${selectedClient.balance > 0 ? 'text-red-700' : selectedClient.balance < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                  Saldo: ${selectedClient.balance.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                </div>
                <div className="inline-flex bg-gray-200 p-1 rounded-md">
                  <button 
                    onClick={() => setViewMode('ALL')}
                    className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'ALL' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setViewMode('PENDING')}
                    className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'PENDING' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Composición de Saldos
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Detalle</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Debe (Cargo)</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Haber (Pago)</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Saldo</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(() => {
                    const displayedTransactions = selectedClient.transactions.filter(tx => {
                      if (viewMode === 'ALL') return true;
                      const applied = getAppliedAmount(tx);
                      return applied < tx.amount; // Only keep pending ones
                    });

                    if (displayedTransactions.length === 0) {
                      return <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay movimientos pendientes.</td></tr>;
                    }

                    return displayedTransactions.map(tx => {
                      const applied = getAppliedAmount(tx);
                      const isFullyApplied = applied >= tx.amount;
                      
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {new Date(tx.date).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {tx.description}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-red-700">
                            {tx.type === 'CHARGE' ? `$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : ''}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-green-700">
                            {tx.type === 'PAYMENT' ? `$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : ''}
                          </td>
                          <td className={`px-4 py-3 text-right text-sm font-bold ${tx.runningBalance > 0 ? 'text-red-700' : tx.runningBalance < 0 ? 'text-green-700' : 'text-gray-700'}`}>
                            ${tx.runningBalance.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {tx.type === 'CHARGE' ? (
                              isFullyApplied ? (
                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">Pagado</span>
                              ) : (
                                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-800">
                                  Debe ${ (tx.amount - applied).toLocaleString('es-AR') }
                                </span>
                              )
                            ) : (
                              isFullyApplied ? (
                                <span className="inline-flex rounded-full bg-gray-200 px-2 py-1 text-xs font-bold text-gray-800">Aplicado</span>
                              ) : (
                                <button 
                                  onClick={() => openApplyModal(tx)}
                                  className="inline-flex rounded bg-indigo-100 hover:bg-indigo-200 px-2 py-1 text-xs font-bold text-indigo-800 transition-colors"
                                >
                                  Aplicar Pago
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      )
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Seleccioná un cliente de la lista para ver su estado de cuenta
          </div>
        )}

        {/* Modal Aplicar Pago */}
        {applyingPayment && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[450px]">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Aplicar Pago a Comprobante</h3>
              <p className="text-sm text-gray-700 mb-4">
                Estás por aplicar un pago (Disponible: <strong>${(applyingPayment.amount - getAppliedAmount(applyingPayment)).toLocaleString('es-AR')}</strong>) a un cargo pendiente.
              </p>
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Seleccionar Cargo a Pagar</label>
                  <select 
                    required 
                    value={targetChargeId} 
                    onChange={e => setTargetChargeId(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  >
                    <option value="">-- Elegir comprobante adeudado --</option>
                    {selectedClient?.transactions
                      .filter(t => t.type === 'CHARGE' && getAppliedAmount(t) < t.amount)
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {new Date(t.date).toLocaleDateString('es-AR')} - {t.description} (Debe: ${(t.amount - getAppliedAmount(t)).toLocaleString('es-AR')})
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Importe a Aplicar ($)</label>
                  <input 
                    type="number" 
                    required 
                    min="0.01" 
                    step="0.01"
                    max={applyingPayment.amount - getAppliedAmount(applyingPayment)}
                    value={applyAmount} 
                    onChange={e => setApplyAmount(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setApplyingPayment(null)}
                    className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    Confirmar Aplicación
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
