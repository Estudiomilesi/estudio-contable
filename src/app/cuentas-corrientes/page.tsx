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

  // Application Modal state
  const [applyingPayment, setApplyingPayment] = useState<Transaction | null>(null);
  const [targetChargeId, setTargetChargeId] = useState<string>('');
  const [applyAmount, setApplyAmount] = useState<string>('');

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
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800 text-lg">Cuentas Corrientes</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Cargando...</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {clientes.map(c => (
                <li 
                  key={c.id} 
                  onClick={() => setSelectedClientId(c.id)}
                  className={`p-4 cursor-pointer hover:bg-indigo-50 transition-colors ${selectedClientId === c.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-gray-900">{c.name}</span>
                      <div className="text-xs text-gray-500 mt-1">Cód: {c.code} | Etiq: {c.professionalLabel}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${c.balance > 0 ? 'text-red-700' : c.balance < 0 ? 'text-green-700' : 'text-gray-700'}`}>
                        ${Math.abs(c.balance).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-gray-500">
                        {c.balance > 0 ? 'Deudor' : c.balance < 0 ? 'A Favor' : 'Saldado'}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Columna Derecha: Detalle del cliente y movimientos */}
      <div className="w-2/3 flex flex-col border rounded-xl bg-white shadow-sm overflow-hidden relative">
        {selectedClient ? (
          <>
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                <p className="text-sm text-gray-700 mt-1">
                  Pagos sin aplicar: <span className="font-semibold text-green-700">${selectedClient.unappliedPayments.toLocaleString('es-AR')}</span> | 
                  Cargos impagos: <span className="font-semibold text-red-700">${selectedClient.unpaidCharges.toLocaleString('es-AR')}</span>
                </p>
              </div>
              <div className={`text-3xl font-black ${selectedClient.balance > 0 ? 'text-red-700' : selectedClient.balance < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                Saldo: ${selectedClient.balance.toLocaleString('es-AR', {minimumFractionDigits: 2})}
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
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {selectedClient.transactions.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay movimientos.</td></tr>
                  ) : (
                    selectedClient.transactions.map(tx => {
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
                    })
                  )}
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
