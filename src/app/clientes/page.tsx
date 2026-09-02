"use client";

import { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

type Client = {
  id: string;
  code: string;
  name: string;
  email: string;
  professionalLabel: string;
  currentFee: number;
  cuit: string | null;
  fiscalCondition: string | null;
  cellphone: string | null;
  address: string | null;
  contact: string | null;
  isActive: boolean;
};

const initialForm = {
  id: '',
  code: '',
  name: '',
  email: '',
  address: '',
  cuit: '',
  cellphone: '',
  contact: '',
  fiscalCondition: '',
  professionalLabel: 'F',
  currentFee: 0,
  isActive: true,
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Client, direction: 'asc' | 'desc' } | null>(null);

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

  const sortedClientes = useMemo(() => {
    let sortableItems = [...clientes];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];
        
        if (sortConfig.key === 'code' || sortConfig.key === 'currentFee') {
          const aNum = parseFloat(aValue as string);
          const bNum = parseFloat(bValue as string);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            aValue = aNum;
            bValue = bNum;
          }
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue as string).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [clientes, sortConfig]);

  const requestSort = (key: keyof Client) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/clientes/${formData.id}` : '/api/clientes';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData(initialForm);
        setIsEditing(false);
        fetchClientes();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al guardar el cliente');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (c: Client) => {
    setFormData({
      id: c.id,
      code: c.code || '',
      name: c.name || '',
      email: c.email || '',
      address: c.address || '',
      cuit: c.cuit || '',
      cellphone: c.cellphone || '',
      contact: c.contact || '',
      fiscalCondition: c.fiscalCondition || '',
      professionalLabel: c.professionalLabel,
      currentFee: c.currentFee,
      isActive: c.isActive,
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este cliente? Solo es posible si no tiene movimientos.')) return;
    
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClientes();
      } else {
        const err = await res.json();
        alert(err.error);
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData(initialForm); }} className="text-sm text-gray-500 hover:text-gray-700">
                Cancelar Edición
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Cliente Activo</label>
            </div>
            
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
            <details className="text-sm text-gray-600" open={isEditing}>
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
                  <input type="text" value={formData.fiscalCondition} onChange={e => setFormData({...formData, fiscalCondition: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
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
              {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className="col-span-1 md:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('code')}>Cód</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('name')}>Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('professionalLabel')}>Etiqueta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('currentFee')}>Abono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('isActive')}>Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Cargando...</td></tr>
                ) : sortedClientes.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay clientes registrados.</td></tr>
                ) : (
                  sortedClientes.map((c) => (
                    <tr key={c.id} className={!c.isActive ? 'opacity-50 bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${c.professionalLabel === 'F' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {c.professionalLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        ${c.currentFee.toLocaleString('es-AR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {c.isActive ? (
                          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500"></span> Activo</span>
                        ) : (
                          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> Inactivo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                        <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-900 p-1"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={18} /></button>
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
