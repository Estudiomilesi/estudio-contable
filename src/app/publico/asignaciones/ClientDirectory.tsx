"use client";

import React, { useState, useMemo } from 'react';

type ClientData = {
  id: string;
  code: string;
  name: string;
  assignedCollaborator: string | null;
};

export default function ClientDirectory({ clients }: { clients: ClientData[] }) {
  const [filterCollaborator, setFilterCollaborator] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ClientData; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  const getCollabColor = (name: string | null) => {
    const explicitColors: Record<string, string> = {
      'Sin asignar': 'bg-gray-100 text-gray-500 border-gray-200',
      'Fede': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Juanma': 'bg-amber-100 text-amber-800 border-amber-200',
      'Alma': 'bg-rose-100 text-rose-800 border-rose-200',
      'Lucho': 'bg-lime-100 text-lime-800 border-lime-200',
      'Juli': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      'Noe': 'bg-purple-100 text-purple-800 border-purple-200',
      'Melisa': 'bg-pink-100 text-pink-800 border-pink-200',
      'Belén': 'bg-teal-100 text-teal-800 border-teal-200',
      'Pauli': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    if (!name) return explicitColors['Sin asignar'];
    if (explicitColors[name]) return explicitColors[name];
    
    // Fallback based on name length just to give it a deterministic color
    const colors = [
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-violet-100 text-violet-800 border-violet-200'
    ];
    return colors[name.length % colors.length];
  };

  const requestSort = (key: keyof ClientData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedClients = useMemo(() => {
    let sortableClients = [...clients];

    if (filterCollaborator !== 'ALL') {
      if (filterCollaborator === 'Sin asignar') {
        sortableClients = sortableClients.filter((c) => !c.assignedCollaborator || c.assignedCollaborator.trim() === '');
      } else {
        sortableClients = sortableClients.filter((c) => c.assignedCollaborator === filterCollaborator);
      }
    }

    if (sortConfig !== null) {
      sortableClients.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';
        
        // Tratar nulos como strings vacíos para el sort
        if (aValue === null) aValue = '';
        if (bValue === null) bValue = '';
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sortableClients;
  }, [clients, filterCollaborator, sortConfig]);

  const uniqueCollaborators = useMemo(() => {
    const colabs = new Set(clients.map(c => c.assignedCollaborator).filter(Boolean));
    return Array.from(colabs).sort() as string[];
  }, [clients]);

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-xl flex flex-col h-[85vh] overflow-hidden border border-gray-200">
          <div className="bg-indigo-600 px-6 py-4 shrink-0 shadow-md z-20">
            <h1 className="text-2xl font-bold text-white">Directorio de Asignaciones</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-4">
              <p className="text-indigo-100 text-sm">
                Listado de clientes activos y sus colaboradores asignados.
              </p>
              <div className="flex items-center gap-2 bg-indigo-700/50 p-2 rounded-lg border border-indigo-500/50">
                <label className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Filtrar por Colaborador:</label>
                <select
                  value={filterCollaborator}
                  onChange={(e) => setFilterCollaborator(e.target.value)}
                  className="rounded bg-white border-0 text-sm py-1 pl-2 pr-8 focus:ring-2 focus:ring-white text-indigo-900 font-bold shadow-sm"
                >
                  <option value="ALL">Todos los colaboradores</option>
                  <option value="Sin asignar">Sin asignar</option>
                  {uniqueCollaborators.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-auto flex-1 relative bg-gray-50">
            <table className="min-w-full divide-y divide-gray-200 border-b border-gray-200">
              <thead className="bg-gray-100 sticky top-0 shadow-sm z-10">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 select-none transition-colors border-r border-gray-200/50"
                    onClick={() => requestSort('code')}
                  >
                    <div className="flex items-center justify-between">
                      Código
                      {sortConfig?.key === 'code' && (<span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 select-none transition-colors border-r border-gray-200/50"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center justify-between">
                      Nombre del Cliente
                      {sortConfig?.key === 'name' && (<span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 select-none transition-colors"
                    onClick={() => requestSort('assignedCollaborator')}
                  >
                    <div className="flex items-center justify-between">
                      Colaborador Asignado
                      {sortConfig?.key === 'assignedCollaborator' && (<span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAndSortedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-indigo-50/50 transition-colors group">
                    <td className="px-6 py-2.5 whitespace-nowrap text-sm font-mono text-gray-500 group-hover:text-indigo-600 transition-colors">
                      {client.code}
                    </td>
                    <td className="px-6 py-2.5 whitespace-nowrap text-sm font-bold text-gray-800">
                      {client.name}
                    </td>
                    <td className="px-6 py-2.5 whitespace-nowrap text-sm text-gray-700">
                      {client.assignedCollaborator ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold shadow-sm ${getCollabColor(client.assignedCollaborator)}`}>
                          {client.assignedCollaborator}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic px-2 py-0.5 text-[11px] border border-transparent">
                          Sin asignar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredAndSortedClients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 bg-white">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-lg font-medium">No se encontraron clientes</p>
                        <p className="text-sm">Prueba ajustando los filtros.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-white px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <span className="font-semibold text-gray-700">Mostrando {filteredAndSortedClients.length} cliente(s)</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Actualizado en tiempo real
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
