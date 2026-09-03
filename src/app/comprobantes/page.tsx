"use client";

import { useState, useEffect, useMemo } from 'react';

type Client = {
  id: string;
  name: string;
  defaultBillingProfile: string;
};

export default function ComprobantesPage() {
  const [clientes, setClientes] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    comprobanteType: 'FACTURA', // FACTURA | NOTA_CREDITO
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    concept: '',
    billingProfile: 'NO_FISCAL',
    amount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch('/api/clientes');
        const data = await res.json();
        setClientes(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientes();
  }, []);

  const handleClientChange = (clientId: string) => {
    const client = clientes.find(c => c.id === clientId);
    setForm(prev => ({
      ...prev,
      clientId,
      billingProfile: client?.defaultBillingProfile || 'NO_FISCAL'
    }));
  };

  const netAmountNum = parseFloat(form.amount) || 0;
  const ivaAmountNum = form.billingProfile === 'FEDE_RI' ? netAmountNum * 0.21 : 0;
  const totalAmountNum = netAmountNum + ivaAmountNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/comprobantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        alert('Comprobante emitido exitosamente');
        setForm({
          ...form,
          concept: '',
          amount: ''
        });
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'Error al emitir'));
      }
    } catch (error) {
      console.error(error);
      alert('Error de red');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando clientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Comprobantes Individuales</h1>
        <p className="text-sm text-gray-500 mt-1">Emití facturas y notas de crédito fuera de los abonos mensuales.</p>
      </div>

      <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Comprobante</label>
              <select 
                required
                value={form.comprobanteType}
                onChange={e => setForm({...form, comprobanteType: e.target.value})}
                className="w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="FACTURA">Factura (Cargo)</option>
                <option value="NOTA_CREDITO">Nota de Crédito (A Favor)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select 
                required
                value={form.clientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión</label>
              <input 
                type="date" 
                required
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value, dueDate: form.comprobanteType === 'FACTURA' ? e.target.value : form.dueDate})} 
                className="w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            {form.comprobanteType === 'FACTURA' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                <input 
                  type="date" 
                  required
                  value={form.dueDate}
                  onChange={e => setForm({...form, dueDate: e.target.value})}
                  className="w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Facturación</label>
              <select 
                required
                value={form.billingProfile}
                onChange={e => setForm({...form, billingProfile: e.target.value})}
                className="w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-semibold text-indigo-900"
              >
                <option value="NO_FISCAL">No Fiscal</option>
                <option value="FEDE_RI">Fede RI (+21% IVA)</option>
                <option value="JUANMA_MONO">JuanMa Mono</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto / Descripción</label>
              <input 
                type="text" 
                required
                placeholder={form.comprobanteType === 'FACTURA' ? "Ej: Certificación de ingresos, Balance..." : "Ej: Anulación de factura N° 123..."}
                value={form.concept}
                onChange={e => setForm({...form, concept: e.target.value})}
                className="w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Neto ($)</label>
            <input 
              type="number" 
              required
              min="0.01"
              step="0.01"
              placeholder="Importe sin IVA..."
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              className="w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between text-sm mb-1 text-gray-600">
              <span>Importe Neto:</span>
              <span>${netAmountNum.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
            </div>
            {form.billingProfile === 'FEDE_RI' && (
              <div className="flex justify-between text-sm mb-1 text-gray-600">
                <span>IVA (21%):</span>
                <span>${ivaAmountNum.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-indigo-900 mt-2 pt-2 border-t border-gray-200">
              <span>Total en Cta. Cte.:</span>
              <span>${totalAmountNum.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-6">
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-lg py-3 px-4 text-white font-bold focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${
                form.comprobanteType === 'FACTURA'
                ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {isSubmitting ? 'Emitiendo...' : `Emitir ${form.comprobanteType === 'FACTURA' ? 'Factura' : 'Nota de Crédito'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
