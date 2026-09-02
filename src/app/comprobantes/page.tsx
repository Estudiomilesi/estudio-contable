"use client";

import { useState, useEffect } from 'react';

type Client = {
  id: string;
  name: string;
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
                onChange={e => setForm({...form, clientId: e.target.value})}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importe ($)</label>
            <input 
              type="number" 
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              className={`w-full rounded-md border p-2.5 shadow-sm focus:ring-2 font-bold text-lg ${
                form.comprobanteType === 'FACTURA' 
                ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900' 
                : 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500 text-green-800'
              }`}
            />
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
