"use client";

import { useState, useEffect } from 'react';

type Client = {
  id: string;
  code: string;
  name: string;
  email: string;
  professionalLabel: string;
  currentFee: number;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    address: '',
    cuit: '',
    cellphone: '',
    contact: '',
    professionalLabel: 'F',
    currentFee: 0,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({
          code: '', name: '', email: '', address: '', cuit: '', cellphone: '', contact: '', professionalLabel: 'F', currentFee: 0
        });
        fetchClientes();
      } else {
        alert('Error al guardar el cliente');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Formulario */}
        <div className="col-span-1 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Nuevo Cliente</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código *</label>
              <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Etiqueta</label>
                <select value={formData.professionalLabel} onChange={e => setFormData({...formData, professionalLabel: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="F">F</option>
                  <option value="FJ">FJ</option>
                  <option value="JF">JF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Abono ($)</label>
                <input type="number" min="0" step="0.01" value={formData.currentFee} onChange={e => setFormData({...formData, currentFee: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>
            {/* Opcionales */}
            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer font-medium text-indigo-600">Más opciones (Opcional)</summary>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Dirección</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">CUIT</label>
                  <input type="text" value={formData.cuit} onChange={e => setFormData({...formData, cuit: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Condición Fiscal</label>
                  <input type="text" value={(formData as any).fiscalCondition || ''} onChange={e => setFormData({...formData, fiscalCondition: e.target.value} as any)} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Celular</label>
                  <input type="text" value={formData.cellphone} onChange={e => setFormData({...formData, cellphone: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Persona de Contacto</label>
                  <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
                </div>
              </div>
            </details>
            <button type="submit" className="w-full rounded-md bg-indigo-600 py-2 px-4 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Guardar Cliente
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className="col-span-1 md:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cód</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiqueta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abono</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Cargando...</td></tr>
                ) : clientes.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay clientes registrados.</td></tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                          {c.professionalLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.currentFee.toLocaleString()}</td>
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
