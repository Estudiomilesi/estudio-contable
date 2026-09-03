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
  hasAbono: boolean;
  defaultBillingProfile: string;
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
  defaultBillingProfile: 'NO_FISCAL',
  currentFee: 0,
  isActive: true,
  hasAbono: true,
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Client, direction: 'asc' | 'desc' } | null>({ key: 'code', direction: 'asc' });
  const [filterLabel, setFilterLabel] = useState<string>('ALL');
  const [filterBillingProfile, setFilterBillingProfile] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState(initialForm);

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

  const filteredAndSortedClientes = useMemo(() => {
    let result = [...clientes];
    
    if (filterLabel !== 'ALL') {
      result = result.filter(c => c.professionalLabel === filterLabel);
    }

    if (filterBillingProfile !== 'ALL') {
      result = result.filter(c => c.defaultBillingProfile === filterBillingProfile);
    }

    if (searchTerm && searchTerm.length >= 3) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        (c.name?.toLowerCase().includes(lowerSearch) || false) || 
        (c.code?.toLowerCase().includes(lowerSearch) || false) ||
        (c.email?.toLowerCase().includes(lowerSearch) || false) ||
        (c.cuit?.toLowerCase().includes(lowerSearch) || false)
      );
    }

    if (sortConfig !== null) {
      result.sort((a, b) => {
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
    return result;
  }, [clientes, sortConfig, filterLabel, filterBillingProfile, searchTerm]);

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
      defaultBillingProfile: c.defaultBillingProfile || 'NO_FISCAL',
      currentFee: c.currentFee,
      isActive: c.isActive,
      hasAbono: c.hasAbono,
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Formulario */}
        <div className="col-span-1 rounded-xl border bg-white p-6 shadow-sm sticky top-6 h-fit max-h-[calc(100vh-40px)] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData(initialForm); }} className="text-sm text-gray-500 hover:text-gray-700">
                Cancelar Edición
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-6 mb-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Cliente Activo</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="hasAbono" checked={formData.hasAbono} onChange={e => setFormData({...formData, hasAbono: e.target.checked})} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="hasAbono" className="text-sm font-medium text-gray-700">Incluir en Abono Mensual</label>
              </div>
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
              <label className="block text-sm font-medium text-gray-700">Email(s) * <span className="text-xs text-gray-400 font-normal">(separa varios con coma)</span></label>
              <input 
                type="email" 
                multiple 
                required 
                placeholder="ejemplo@correo.com, otro@correo.com"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Etiqueta</label>
                <select value={formData.professionalLabel} onChange={e => setFormData({...formData, professionalLabel: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="F">F</option>
                  <option value="FJ">FJ</option>
                  <option value="JF">JF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Perfil Fac.</label>
                <select value={formData.defaultBillingProfile} onChange={e => setFormData({...formData, defaultBillingProfile: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="NO_FISCAL">No Fiscal</option>
                  <option value="FEDE_RI">Fede RI (+21%)</option>
                  <option value="JUANMA_MONO">JuanMa Mono</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Abono Neto($)</label>
                <input type="number" min="0" step="0.01" value={formData.currentFee} onChange={e => setFormData({...formData, currentFee: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>
            {/* Opcionales */}
            <details className="text-sm text-gray-800" open={isEditing}>
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
        <div className="col-span-1 md:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col h-[calc(100vh-100px)]">
          
          <div className="p-3 border-b bg-gray-50 flex items-center justify-between sticky top-0 z-20">
            <div className="relative w-64">
              <input 
                type="text" 
                placeholder="Buscar (min 3 letras)..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md p-2 pl-8 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {filteredAndSortedClientes.length} cliente(s)
            </div>
          </div>

          <div className="overflow-x-auto flex-1 p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('code')}>Cód</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('name')}>Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:bg-gray-200 px-1 rounded" onClick={() => requestSort('professionalLabel')}>Etiqueta</span>
                      <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)} className="text-[10px] border-gray-300 rounded p-0 h-5">
                        <option value="ALL">Todas</option>
                        <option value="F">F</option>
                        <option value="FJ">FJ</option>
                        <option value="JF">JF</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:bg-gray-200 px-1 rounded" onClick={() => requestSort('defaultBillingProfile')}>Perfil Fac.</span>
                      <select value={filterBillingProfile} onChange={e => setFilterBillingProfile(e.target.value)} className="text-[10px] border-gray-300 rounded p-0 h-5 w-20">
                        <option value="ALL">Todos</option>
                        <option value="FEDE_RI">RI</option>
                        <option value="JUANMA_MONO">Mono</option>
                        <option value="NO_FISCAL">No F.</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('currentFee')}>Abono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('isActive')}>Estado</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={8} className="px-6 py-4 text-center text-gray-700">Cargando...</td></tr>
                ) : filteredAndSortedClientes.length === 0 ? (
                  <tr><td colSpan={8} className="p-4 text-center text-gray-500">No hay clientes.</td></tr>
                ) : (
                  filteredAndSortedClientes.map((c: Client) => (
                    <tr key={c.id} className={!c.isActive ? 'opacity-50 bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className={`inline-flex rounded-full px-2 text-xs font-bold leading-5 ${
                          c.professionalLabel === 'F' ? 'bg-green-200 text-green-900' : 
                          c.professionalLabel === 'FJ' ? 'bg-orange-200 text-orange-900' : 
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {c.professionalLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.defaultBillingProfile === 'FEDE_RI' ? 'Fede RI' : c.defaultBillingProfile === 'JUANMA_MONO' ? 'JuanMa Mono' : 'No Fiscal'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        ${c.currentFee.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.isActive ? (
                          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500"></span> Activo</span>
                        ) : (
                          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> Inactivo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-sm font-medium flex justify-end gap-2">
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
