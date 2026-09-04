"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

type Concept = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
};

export default function ConfiguracionPage() {
  const [conceptos, setConceptos] = useState<Concept[]>([]);
  const [activeTab, setActiveTab] = useState<'BILLING' | 'TREASURY'>('BILLING');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'BILLING' });

  useEffect(() => {
    fetchConceptos();
  }, []);

  const fetchConceptos = async () => {
    const res = await fetch('/api/conceptos');
    if (res.ok) {
      const data = await res.json();
      setConceptos(data);
    }
  };

  const filteredConceptos = conceptos.filter(c => 
    activeTab === 'BILLING' ? c.type === 'BILLING' : (c.type === 'TREASURY_INCOME' || c.type === 'TREASURY_EXPENSE')
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch('/api/conceptos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, name: form.name, isActive: true }) // simplify
      });
    } else {
      await fetch('/api/conceptos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    }
    setIsModalOpen(false);
    fetchConceptos();
  };

  const handleToggleActive = async (c: Concept) => {
    await fetch('/api/conceptos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, isActive: !c.isActive })
    });
    fetchConceptos();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este concepto?')) {
      await fetch('/api/conceptos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchConceptos();
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', type: activeTab === 'BILLING' ? 'BILLING' : 'TREASURY_EXPENSE' });
    setIsModalOpen(true);
  };

  const openEdit = (c: Concept) => {
    setEditingId(c.id);
    setForm({ name: c.name, type: c.type });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">Administra los conceptos y configuraciones generales del sistema.</p>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('BILLING')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'BILLING' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Conceptos de Facturación
        </button>
        <button
          onClick={() => setActiveTab('TREASURY')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'TREASURY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Conceptos de Tesorería
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {activeTab === 'BILLING' ? 'Conceptos para Comprobantes' : 'Conceptos para Tesorería'}
        </h2>
        <button onClick={openNew} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={16} /> Nuevo Concepto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Nombre</th>
              {activeTab === 'TREASURY' && (
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Flujo (Ingreso/Egreso)</th>
              )}
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredConceptos.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                {activeTab === 'TREASURY' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {c.type === 'TREASURY_INCOME' ? 'Ingreso' : 'Egreso'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  <button onClick={() => handleToggleActive(c)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredConceptos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay conceptos creados en esta categoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              {editingId ? 'Editar Concepto' : 'Nuevo Concepto'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Concepto</label>
                <input 
                  type="text" 
                  required 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {activeTab === 'TREASURY' && !editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Flujo</label>
                  <select 
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="TREASURY_INCOME">Ingreso</option>
                    <option value="TREASURY_EXPENSE">Egreso</option>
                  </select>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
