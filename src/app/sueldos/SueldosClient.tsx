"use client";

import { useState } from 'react';
import { Check, Wallet } from 'lucide-react';

export default function SueldosClient({ initialSalaries, availableChecks }: { initialSalaries: any[], availableChecks: any[] }) {
  const [salaries, setSalaries] = useState(initialSalaries);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<any>(null);
  const [formData, setFormData] = useState({
    account: 'CAJA',
    date: new Date().toISOString().split('T')[0],
  });
  const [selectedCheckIds, setSelectedCheckIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group by month
  const PREFERRED_ORDER = ['Luichi', 'Lucho', 'Pauli', 'Juli', 'Noe', 'Alma', 'Belén', 'Melisa', 'Gessi'];
  const uniqueEmps = Array.from(new Set(salaries.map(s => s.employee.name)));
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

  const handleOpenModal = (salary: any) => {
    setSelectedSalary(salary);
    setIsModalOpen(true);
    setFormData({ account: 'CAJA', date: new Date().toISOString().split('T')[0] });
    setSelectedCheckIds([]);
  };

  const handleToggleCheck = (id: string) => {
    if (selectedCheckIds.includes(id)) {
      setSelectedCheckIds(selectedCheckIds.filter(x => x !== id));
    } else {
      setSelectedCheckIds([...selectedCheckIds, id]);
    }
  };

  const selectedChecksTotal = availableChecks.filter(c => selectedCheckIds.includes(c.id)).reduce((sum, c) => sum + c.amount, 0);

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalary) return;
    if (formData.account === 'CHEQUES' && selectedChecksTotal !== selectedSalary.amount) {
      if (!confirm(`El monto de los cheques (${selectedChecksTotal}) no coincide exactamente con el sueldo (${selectedSalary.amount}). ¿Desea continuar igual?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sueldos/pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salaryId: selectedSalary.id,
          account: formData.account,
          date: formData.date,
          checkDetails: formData.account === 'CHEQUES' ? selectedCheckIds : []
        })
      });

      if (!res.ok) throw new Error(await res.text());

      // Update UI
      setSalaries(salaries.map(s => s.id === selectedSalary.id ? { ...s, isPaid: true, paidAt: new Date(formData.date) } : s));
      setIsModalOpen(false);
    } catch (error) {
      alert(error);
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
                    
                    return (
                      <td key={emp} className="px-4 py-2 whitespace-nowrap text-right tabular-nums">
                        {s.isPaid ? (
                          <div className="flex flex-col items-end justify-center h-full">
                            <span className="font-medium text-gray-900">${s.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            {s.paidAt && <span className="text-[10px] text-gray-400 mt-0.5"><Check size={10} className="inline mr-0.5"/>Pagado</span>}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenModal(s)}
                            className="inline-flex flex-col items-end px-2 py-1 rounded bg-yellow-50 border border-yellow-300 hover:bg-yellow-100 hover:border-yellow-400 transition-all cursor-pointer group shadow-sm"
                          >
                            <span className="font-bold text-red-600 group-hover:text-red-700">${s.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            <span className="text-[10px] text-yellow-800 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                              <Wallet size={10} /> Pagar
                            </span>
                          </button>
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
      {isModalOpen && selectedSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Pagar Sueldo: {selectedSalary.employee.name}
            </h3>
            <div className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Período</p>
              <p className="font-semibold text-gray-900">{selectedSalary.month}</p>
              <p className="text-sm text-gray-500 mt-2">Importe a Pagar</p>
              <p className="text-2xl font-black text-red-600">
                ${selectedSalary.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits:2})}
              </p>
            </div>

            <form onSubmit={handlePagar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cuenta de Origen</label>
                <select 
                  value={formData.account}
                  onChange={e => {
                    setFormData({...formData, account: e.target.value});
                    setSelectedCheckIds([]);
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="CAJA">Caja</option>
                  <option value="BANCOS FEDE">Bancos Fede</option>
                  <option value="BANCOS JUANMA">Bancos Juanma</option>
                  <option value="CHEQUES">Cheques de Terceros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
                <input 
                  type="date" 
                  required 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {formData.account === 'CHEQUES' && (
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
                    <span className={selectedChecksTotal === selectedSalary.amount ? 'text-green-600' : 'text-red-600'}>
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
                  disabled={isSubmitting || (formData.account === 'CHEQUES' && selectedCheckIds.length === 0)}
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
