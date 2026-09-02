"use client";

import { useState, useEffect } from 'react';

type TreasuryTransaction = {
  id: string;
  date: string;
  amount: number;
  type: string;
  account: string;
  category: string;
  description: string | null;
};

export default function TesoreriaPage() {
  const [transacciones, setTransacciones] = useState<TreasuryTransaction[]>([]);
  const [saldos, setSaldos] = useState({ CAJA: 0, BANCOS: 0, CHEQUES: 0 });
  const [clientes, setClientes] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'INCOME', // INCOME, EXPENSE
    account: 'CAJA', // CAJA, BANCOS, CHEQUES
    category: 'Honorarios', // Honorarios, Gastos, Retiro Fede, Retiro Juanma, Otros
    amount: '',
    description: '',
    clientId: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resT = await fetch('/api/tesoreria');
      const dataT = await resT.json();
      setTransacciones(dataT.transacciones || []);
      setSaldos(dataT.saldos || { CAJA: 0, BANCOS: 0, CHEQUES: 0 });

      const resC = await fetch('/api/clientes');
      const dataC = await resC.json();
      setClientes(dataC);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ajustar monto según tipo (ingreso positivo, egreso negativo)
      const amount = formData.type === 'EXPENSE' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount));
      
      const payload = { ...formData, amount };

      const res = await fetch('/api/tesoreria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFormData({ ...formData, amount: '', description: '', clientId: '' });
        fetchData();
      } else {
        alert('Error al guardar el movimiento');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saldoTotal = saldos.CAJA + saldos.BANCOS + saldos.CHEQUES;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Tesorería</h1>

      {/* Saldos Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm border-l-4 border-l-indigo-500">
          <h3 className="text-sm font-medium text-gray-500">Total Disponible</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">${saldoTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Caja</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-700">${saldos.CAJA.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Bancos</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-700">${saldos.BANCOS.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Cheques</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-700">${saldos.CHEQUES.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulario */}
        <div className="col-span-1 rounded-xl border bg-white p-6 shadow-sm h-fit">
          <h2 className="mb-4 text-xl font-semibold">Registrar Movimiento</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-medium">
                  <option value="INCOME">Ingreso</option>
                  <option value="EXPENSE">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cuenta</label>
                <select value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="CAJA">Caja</option>
                  <option value="BANCOS">Bancos</option>
                  <option value="CHEQUES">Cheques</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Importe ($)</label>
                <input type="number" required min="0" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                {formData.type === 'INCOME' ? (
                  <>
                    <option value="Honorarios">Cobro Honorarios</option>
                    <option value="Otros Ingresos">Otros Ingresos</option>
                  </>
                ) : (
                  <>
                    <option value="Gastos">Gastos Generales</option>
                    <option value="Retiro Fede">Retiros Fede</option>
                    <option value="Retiro Juanma">Retiros Juanma</option>
                    <option value="Otros Egresos">Otros Egresos</option>
                  </>
                )}
              </select>
            </div>

            {formData.category === 'Honorarios' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente (Para Cta. Corriente)</label>
                <select value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="">-- Seleccionar Cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción / Concepto</label>
              <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Ej: Pago internet, Factura N°123..." />
            </div>
            
            <button type="submit" className={`w-full rounded-md py-2 px-4 text-white font-medium focus:ring-2 focus:ring-offset-2 ${formData.type === 'INCOME' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}>
              Registrar {formData.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700">
            Últimos Movimientos
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría / Detalle</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Importe</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">Cargando...</td></tr>
                ) : transacciones.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No hay movimientos.</td></tr>
                ) : (
                  transacciones.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(t.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-800">
                          {t.account}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        <div className="font-medium">{t.category}</div>
                        <div className="text-gray-500 text-xs truncate max-w-xs" title={t.description || ''}>{t.description}</div>
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-right text-sm font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
