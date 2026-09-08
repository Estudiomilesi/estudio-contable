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
  const [bancos, setBancos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'BILLING' | 'TREASURY' | 'BANKS'>('BILLING');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'BILLING' });
  const [bankForm, setBankForm] = useState({ name: '', cbu: '', cvu: '', alias: '', owner: '', cuit: '', isFedeRIDefault: false, isJuanmaMonoDefault: false, isActive: true });

  useEffect(() => {
    fetchConceptos();
    fetchBancos();
  }, []);

  const fetchConceptos = async () => {
    const res = await fetch('/api/conceptos');
    if (res.ok) {
      const data = await res.json();
      setConceptos(data);
    }
  };

  const fetchBancos = async () => {
    const res = await fetch('/api/bancos');
    if (res.ok) {
      const data = await res.json();
      setBancos(data);
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

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch('/api/bancos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...bankForm })
      });
    } else {
      await fetch('/api/bancos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm)
      });
    }
    setIsBankModalOpen(false);
    fetchBancos();
  };

  const handleDeleteBank = async (id: string) => {
    if (confirm('¿Eliminar esta cuenta bancaria?')) {
      const res = await fetch('/api/bancos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
      }
      fetchBancos();
    }
  };

  const openNewBank = () => {
    setEditingId(null);
    setBankForm({ name: '', cbu: '', cvu: '', alias: '', owner: '', cuit: '', isFedeRIDefault: false, isJuanmaMonoDefault: false, isActive: true });
    setIsBankModalOpen(true);
  };

  const openEditBank = (b: any) => {
    setEditingId(b.id);
    setBankForm({ name: b.name, cbu: b.cbu || '', cvu: b.cvu || '', alias: b.alias || '', owner: b.owner, cuit: b.cuit || '', isFedeRIDefault: b.isFedeRIDefault, isJuanmaMonoDefault: b.isJuanmaMonoDefault, isActive: b.isActive });
    setIsBankModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">Administra los conceptos y configuraciones generales del sistema.</p>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
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
        <button
          onClick={() => setActiveTab('BANKS')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'BANKS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Cuentas Bancarias (CBU)
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {activeTab === 'BILLING' ? 'Conceptos para Comprobantes' : activeTab === 'TREASURY' ? 'Conceptos para Tesorería' : 'Cuentas Bancarias Registradas'}
        </h2>
        <button onClick={activeTab === 'BANKS' ? openNewBank : openNew} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={16} /> {activeTab === 'BANKS' ? 'Nueva Cuenta' : 'Nuevo Concepto'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'BANKS' ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Titular / CUIT</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">CBU/CVU y Alias</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Predeterminadas</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bancos.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{b.owner}</div>
                    {b.cuit && <div className="text-xs text-gray-400">CUIT: {b.cuit}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(b.cbu || b.cvu) && <div>Nro: {b.cbu || b.cvu}</div>}
                    {b.alias && <div>Alias: {b.alias}</div>}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    {b.isFedeRIDefault && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">Fede RI</span>}
                    {b.isJuanmaMonoDefault && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Juanma Mono</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditBank(b)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteBank(b.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {bancos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay cuentas bancarias creados.</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
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
        )}
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

      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              {editingId ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
            </h3>
            <form onSubmit={handleSaveBank} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre (ej: Santander Fede)</label>
                  <input type="text" required value={bankForm.name} onChange={e => setBankForm({...bankForm, name: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alias</label>
                  <input type="text" value={bankForm.alias} onChange={e => setBankForm({...bankForm, alias: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">CBU / CVU</label>
                  <input type="text" value={bankForm.cbu} onChange={e => setBankForm({...bankForm, cbu: e.target.value, cvu: ''})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Ingresar CBU o CVU" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Titular de la cuenta</label>
                  <input type="text" required value={bankForm.owner} onChange={e => setBankForm({...bankForm, owner: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CUIT del titular</label>
                  <input type="text" value={bankForm.cuit} onChange={e => setBankForm({...bankForm, cuit: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Ej: 20-12345678-9" />
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t mt-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={bankForm.isFedeRIDefault} onChange={e => setBankForm({...bankForm, isFedeRIDefault: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">Predeterminada para Fede RI</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={bankForm.isJuanmaMonoDefault} onChange={e => setBankForm({...bankForm, isJuanmaMonoDefault: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">Predeterminada para Juanma Mono</span>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsBankModalOpen(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
