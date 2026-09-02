"use client";

import { useState, useEffect } from 'react';

type Client = {
  id: string;
  code: string;
  name: string;
  currentFee: number;
  professionalLabel: string;
};

export default function FacturacionPage() {
  const [clientes, setClientes] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ediciones, setEdiciones] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchClientes = async () => {
    setIsLoading(true);
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

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleFeeChange = (id: string, value: string) => {
    setEdiciones(prev => ({
      ...prev,
      [id]: parseFloat(value) || 0
    }));
  };

  const guardarCambiosMasivos = async () => {
    const updates = Object.entries(ediciones).map(([id, currentFee]) => ({ id, currentFee }));
    if (updates.length === 0) {
      alert('No hay cambios para guardar.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/facturacion/masivo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (res.ok) {
        alert('Valores actualizados exitosamente.');
        setEdiciones({});
        fetchClientes();
      } else {
        alert('Hubo un error al guardar los cambios.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const ejecutarProcesoMensual = async () => {
    if (!confirm('¿Estás seguro de que deseas facturar el abono actual a todos los clientes? Esto generará los cargos en sus cuentas corrientes.')) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/facturacion/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Abono Mensual' })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert('Hubo un error en la facturación masiva.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Facturación (Abonos)</h1>
        <div className="flex gap-4">
          <button 
            onClick={guardarCambiosMasivos} 
            disabled={isSaving || Object.keys(ediciones).length === 0}
            className="rounded-md bg-white border border-gray-300 py-2 px-4 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios de Importes'}
          </button>
          
          <button 
            onClick={ejecutarProcesoMensual}
            disabled={isProcessing}
            className="rounded-md bg-indigo-600 py-2 px-4 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isProcessing ? 'Procesando...' : '▶ Ejecutar Proceso Mensual'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cód</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiqueta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abono Actual ($)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Cargando...</td></tr>
              ) : clientes.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No hay clientes.</td></tr>
              ) : (
                clientes.map((c) => {
                  const currentValue = ediciones[c.id] !== undefined ? ediciones[c.id] : c.currentFee;
                  const isEdited = ediciones[c.id] !== undefined;

                  return (
                    <tr key={c.id} className={isEdited ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                          {c.professionalLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input 
                          type="number"
                          min="0"
                          step="1"
                          value={currentValue}
                          onChange={(e) => handleFeeChange(c.id, e.target.value)}
                          className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1 border"
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
