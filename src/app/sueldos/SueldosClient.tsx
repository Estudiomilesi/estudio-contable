"use client";

import { useState } from 'react';
import { Check, Wallet } from 'lucide-react';

export default function SueldosClient({ initialSalaries, availableChecks }: { initialSalaries: any[], availableChecks: any[] }) {
  const [salaries, setSalaries] = useState(initialSalaries);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payments, setPayments] = useState<{account: string, amount: string}[]>([
    { account: 'CAJA', amount: '' }
  ]);
  const [selectedCheckIds, setSelectedCheckIds] = useState<string[]>([]);
  const [selectedSalaries, setSelectedSalaries] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLiquidarModalOpen, setIsLiquidarModalOpen] = useState(false);
  const [liquidarMonth, setLiquidarMonth] = useState(new Date().toISOString().slice(0, 7));
  const [liquidarAmounts, setLiquidarAmounts] = useState<Record<string, string>>({});

  // Group by month
  const PREFERRED_ORDER = ['Luichi', 'Lucho', 'Pauli', 'Juli', 'Noe', 'Alma', 'Belén', 'Melisa', 'Gessi'];
  
  const employeeMap = new Map<string, string>();
  salaries.forEach(s => {
    if (!employeeMap.has(s.employee.name)) {
      employeeMap.set(s.employee.name, s.employee.id);
    }
  });

  const uniqueEmps = Array.from(employeeMap.keys());
  const employees = uniqueEmps.sort((a, b) => {
    const ia = PREFERRED_ORDER.indexOf(a);
    const ib = PREFERRED_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const grouped = salaries.reduce((acc, s) => {
    if (!acc[s.month]) acc[s.month] = {};
    acc[s.month][s.employee.name] = s;
    return acc;
  }, {} as Record<string, Record<string, any>>);

  const months = Object.keys(grouped).sort().reverse();

  const handleToggleCheck = (id: string) => {
    if (selectedCheckIds.includes(id)) {
      setSelectedCheckIds(selectedCheckIds.filter(x => x !== id));
    } else {
      setSelectedCheckIds([...selectedCheckIds, id]);
    }
  };

  const handleToggleSalary = (salary: any) => {
    if (selectedSalaries.some(s => s.id === salary.id)) {
      setSelectedSalaries(selectedSalaries.filter(s => s.id !== salary.id));
    } else {
      setSelectedSalaries([...selectedSalaries, salary]);
    }
  };

  const selectedChecksTotal = availableChecks.filter(c => selectedCheckIds.includes(c.id)).reduce((sum, c) => sum + c.amount, 0);

  const totalToPay = selectedSalaries.reduce((acc, s) => acc + s.amount, 0);

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSalaries.length === 0) return;

    // Prepare payload payments
    const payloadPayments = payments.map(p => {
      if (p.account === 'CHEQUES') {
        return { account: 'CHEQUES', amount: selectedChecksTotal, checkIds: selectedCheckIds };
      }
      return { account: p.account, amount: parseFloat(p.amount) || 0 };
    }).filter(p => p.amount > 0);

    const totalPagado = payloadPayments.reduce((acc, p) => acc + p.amount, 0);
    
    if (Math.abs(totalPagado - totalToPay) > 1) {
      if (!confirm(`El monto total ingresado ($${totalPagado}) no coincide exactamente con el sueldo ($${totalToPay}). ¿Desea continuar de todos modos?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sueldos/pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salaryIds: selectedSalaries.map(s => s.id),
          date: payDate,
          payments: payloadPayments
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error desconocido');
      }

      // Update UI
      const payIds = selectedSalaries.map(s => s.id);
      setSalaries(salaries.map(s => payIds.includes(s.id) ? { ...s, isPaid: true, paidAt: new Date(payDate) } : s));
      setIsModalOpen(false);
      setSelectedSalaries([]);
    } catch (error: any) {
      alert(error.message || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiquidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payloadSalaries = employees.map(emp => ({
      employeeId: employeeMap.get(emp),
      amount: parseFloat(liquidarAmounts[emp] || '0')
    })).filter(s => s.amount > 0);

    try {
      const res = await fetch('/api/sueldos/liquidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: liquidarMonth,
          salaries: payloadSalaries
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error desconocido');
      }

      // We need to refresh the page to get the new salaries from the DB
      window.location.reload();
    } catch (error: any) {
      alert(error.message || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Liquidación de Sueldos</h1>
          <p className="mt-2 text-gray-600">Historial y pagos de sueldos al equipo.</p>
        </div>
        <div className="flex gap-4">
          {selectedSalaries.length > 0 && (
            <button
              onClick={() => {
                setIsModalOpen(true);
                setPayDate(new Date().toISOString().split('T')[0]);
                setPayments([{ account: 'CAJA', amount: totalToPay.toString() }]);
                setSelectedCheckIds([]);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 shadow-sm transition-all"
            >
              Pagar Seleccionados ({selectedSalaries.length}) - ${totalToPay.toLocaleString('es-AR')}
            </button>
          )}
          <button 
            onClick={() => setIsLiquidarModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 shadow-sm transition-all flex items-center gap-2"
          >
            Liquidar Nuevo Mes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto max-h-[75vh]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase bg-gray-50">Mes</th>
              {employees.map(emp => (
                <th key={emp} className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase bg-gray-50">{emp}</th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-black text-gray-800 uppercase bg-gray-100 border-l border-gray-200">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {months.map(month => {
              const mData = grouped[month];
              let rowTotal = 0;
              return (
                <tr key={month} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900 bg-white sticky left-0 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {month}
                  </td>
                  {employees.map(emp => {
                    const s = mData[emp];
                    if (!s) return <td key={emp} className="px-4 py-4 text-right text-gray-300 font-medium">-</td>;
                    
                    rowTotal += s.amount;
                    const isSelected = selectedSalaries.some(sel => sel.id === s.id);
                    
                    return (
                      <td key={emp} className={`px-4 py-2 whitespace-nowrap text-right tabular-nums transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-200 border ring-1 ring-inset ring-indigo-500 rounded' : ''}`}>
                        {s.isPaid ? (
                          <div className="flex flex-col items-end justify-center h-full">
                            <span className="font-medium text-gray-900">${s.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            {s.paidAt && <span className="text-[10px] text-gray-400 mt-0.5"><Check size={10} className="inline mr-0.5"/>Pagado</span>}
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <label className="flex items-center gap-2 cursor-pointer bg-yellow-50 hover:bg-yellow-100 px-2 py-1 rounded border border-yellow-200 shadow-sm w-full justify-end">
                              <span className="font-bold text-red-600">${s.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => handleToggleSalary(s)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                              />
                            </label>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-4 whitespace-nowrap text-right tabular-nums font-black bg-gray-50 text-gray-900 border-l border-gray-200">
                    ${rowTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedSalaries.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Pagar Sueldos Seleccionados
            </h3>
            <div className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Cantidad de Sueldos</p>
              <p className="font-semibold text-gray-900">{selectedSalaries.length}</p>
              <p className="text-sm text-gray-500 mt-2">Importe a Pagar</p>
              <p className="text-2xl font-black text-red-600">
                ${totalToPay.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits:2})}
              </p>
            </div>

            <form onSubmit={handlePagar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medios de Pago</label>
                {payments.map((p, index) => (
                  <div key={index} className="flex gap-2 mb-2 items-start">
                    <select 
                      value={p.account}
                      onChange={e => {
                        const newP = [...payments];
                        newP[index].account = e.target.value;
                        if (e.target.value !== 'CHEQUES' && p.account === 'CHEQUES') {
                          setSelectedCheckIds([]);
                        }
                        setPayments(newP);
                      }}
                      className="flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                      <option value="CAJA">Caja</option>
                      <option value="BANCOS FEDE">Bancos Fede</option>
                      <option value="BANCOS JUANMA">Bancos Juanma</option>
                      <option value="CHEQUES">Cheques de Terceros</option>
                    </select>
                    
                    {p.account !== 'CHEQUES' ? (
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        required
                        value={p.amount}
                        onChange={e => {
                          const newP = [...payments];
                          newP[index].amount = e.target.value;
                          setPayments(newP);
                        }}
                        className="w-32 rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold"
                        placeholder="Importe"
                      />
                    ) : (
                      <div className="w-32 p-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-bold text-gray-500 text-right">
                        ${selectedChecksTotal.toLocaleString('es-AR')}
                      </div>
                    )}

                    {payments.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        X
                      </button>
                    )}
                  </div>
                ))}
                
                <button 
                  type="button"
                  onClick={() => setPayments([...payments, { account: 'CAJA', amount: '' }])}
                  className="text-xs text-indigo-600 font-bold hover:text-indigo-800 mt-1"
                >
                  + Agregar otro medio de pago
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
                <input 
                  type="date" 
                  required 
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {payments.some(p => p.account === 'CHEQUES') && (
                <div className="mt-4 border rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                  <h4 className="text-sm font-semibold mb-2 text-gray-700">Seleccionar Cheques</h4>
                  {availableChecks.length === 0 ? (
                    <p className="text-xs text-red-600">No hay cheques en cartera disponibles.</p>
                  ) : (
                    <div className="space-y-2">
                      {availableChecks.map(c => (
                        <label key={c.id} className="flex items-center text-xs gap-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedCheckIds.includes(c.id)} onChange={() => handleToggleCheck(c.id)} />
                          <span className="flex-1 font-medium">{c.bank} N° {c.number}</span>
                          <span className="font-bold text-gray-900">${c.amount.toLocaleString('es-AR')}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t font-semibold text-sm flex justify-between">
                    <span>Total Seleccionado:</span>
                    <span className="text-indigo-600">
                      ${selectedChecksTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  disabled={isSubmitting || (payments.some(p => p.account === 'CHEQUES') && selectedCheckIds.length === 0)}
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Liquidar Modal */}
      {isLiquidarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Liquidar Nuevo Mes
            </h3>
            
            <form onSubmit={handleLiquidar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mes a Liquidar (YYYY-MM)</label>
                <input 
                  type="month" 
                  required 
                  value={liquidarMonth}
                  onChange={e => setLiquidarMonth(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-700">Importes de Sueldos</h4>
                <div className="space-y-3">
                  {employees.map(emp => (
                    <div key={emp} className="flex items-center gap-3">
                      <label className="w-24 text-sm font-medium text-gray-700">{emp}</label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={liquidarAmounts[emp] || ''}
                        onChange={e => setLiquidarAmounts({...liquidarAmounts, [emp]: e.target.value})}
                        className="flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold"
                        placeholder="Importe a cobrar"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLiquidarModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Liquidación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
