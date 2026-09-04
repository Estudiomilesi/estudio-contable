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
  const grouped = salaries.reduce((acc, s) => {
    if (!acc[s.month]) acc[s.month] = [];
    acc[s.month].push(s);
    return acc;
  }, {} as Record<string, any[]>);

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {months.map(month => {
          const mSalaries = grouped[month];
          const totalAmount = mSalaries.reduce((sum: number, s: any) => sum + s.amount, 0);
          const totalPaid = mSalaries.filter((s: any) => s.isPaid).reduce((sum: number, s: any) => sum + s.amount, 0);

          return (
            <div key={month} className="border-b border-gray-200 last:border-0">
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">{month}</h2>
                <div className="text-sm text-gray-600 font-medium">
                  Pagado: <span className="text-green-700">${totalPaid.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span> / 
                  Total: <span className="text-gray-900 ml-1">${totalAmount.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Colaborador</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Importe</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {mSalaries.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900">{s.employee.name}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-right tabular-nums text-gray-700 font-medium">
                          ${s.amount.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center">
                          {s.isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              <Check size={14} /> Pagado
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          {!s.isPaid && (
                            <button
                              onClick={() => handleOpenModal(s)}
                              className="inline-flex items-center gap-1 rounded bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              <Wallet size={14} /> Registrar Pago
                            </button>
                          )}
                          {s.isPaid && s.paidAt && (
                            <span className="text-xs text-gray-400">
                              {new Date(s.paidAt).toLocaleDateString('es-AR')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
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
