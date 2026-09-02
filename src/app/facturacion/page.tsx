"use client";

import { useState, useEffect, useMemo } from 'react';

type AccountTransaction = {
  id: string;
  date: string;
  amount: number;
};

type Client = {
  id: string;
  code: string;
  name: string;
  currentFee: number;
  professionalLabel: string;
  accountTransactions: AccountTransaction[];
};

export default function FacturacionPage() {
  const [clientes, setClientes] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ediciones, setEdiciones] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [billingDate, setBillingDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof Client, direction: 'asc' | 'desc' } | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>('ALL');

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/facturacion');
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

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];
        
        if (sortConfig.key === 'code') {
          const aNum = parseInt(aValue);
          const bNum = parseInt(bValue);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            aValue = aNum;
            bValue = bNum;
          }
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [clientes, sortConfig, filterLabel]);

  const requestSort = (key: keyof Client) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFeeChange = (id: string, value: string) => {
    setEdiciones(prev => ({
      ...prev,
      [id]: parseFloat(value) || 0
    }));
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedIds(newSelection);
  };

  const toggleAll = () => {
    if (selectedIds.size === clientes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clientes.map(c => c.id)));
    }
  };

  const guardarCambiosMasivos = async () => {
    const updates = Object.entries(ediciones).map(([id, currentFee]) => ({ id, currentFee }));
    if (updates.length === 0) return;

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
    const targetClients = selectedIds.size > 0 ? Array.from(selectedIds) : clientes.map(c => c.id);
    
    if (!confirm(`¿Emitir abonos para ${targetClients.length} clientes seleccionados con fecha ${billingDate}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/facturacion/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: 'Abono Mensual',
          billingDate,
          clientIds: targetClients
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchClientes(); // Refresh to show the new history
        setSelectedIds(new Set());
      } else {
        alert('Hubo un error en la facturación masiva.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Extraer los últimos 12 meses (agrupados por fecha de transacción para los headers de la tabla)
  // En un caso real se agruparía por mes, aquí extraemos las fechas únicas recientes de las transacciones.
  const historyDates = useMemo(() => {
    const dates = new Set<string>();
    clientes.forEach(c => {
      c.accountTransactions?.forEach(t => {
        const monthYear = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM
        dates.add(monthYear);
      });
    });
    // Sort oldest to newest (left to right)
    return Array.from(dates).sort().slice(-12);
  }, [clientes]);

  // Totals
  const totales = useMemo(() => {
    let F = 0, FJ = 0, JF = 0, General = 0;
    let countF = 0, countFJ = 0, countJF = 0, countGeneral = 0;
    clientes.forEach(c => {
      const fee = ediciones[c.id] !== undefined ? ediciones[c.id] : c.currentFee;
      General += fee;
      countGeneral++;
      if (c.professionalLabel === 'F') { F += fee; countF++; }
      if (c.professionalLabel === 'FJ') { FJ += fee; countFJ++; }
      if (c.professionalLabel === 'JF') { JF += fee; countJF++; }
    });
    return { F, FJ, JF, General, countF, countFJ, countJF, countGeneral };
  }, [clientes, ediciones]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Abonos</h1>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={billingDate}
            onChange={e => setBillingDate(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
          <button 
            onClick={guardarCambiosMasivos} 
            disabled={isSaving || Object.keys(ediciones).length === 0}
            className="rounded-md bg-white border border-gray-300 py-1.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Importes'}
          </button>
          
          <button 
            onClick={ejecutarProcesoMensual}
            disabled={isProcessing}
            className="rounded-md bg-indigo-600 py-1.5 px-3 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isProcessing ? 'Procesando...' : `▶ Ejecutar (${selectedIds.size > 0 ? selectedIds.size : 'Todos'})`}
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2 text-center w-10">
                  <input 
                    type="checkbox" 
                    checked={clientes.length > 0 && selectedIds.size === clientes.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-800 cursor-pointer hover:bg-gray-200" onClick={() => requestSort('code')}>Cód</th>
                <th className="px-2 py-2 text-left font-medium text-gray-800 cursor-pointer hover:bg-gray-200" onClick={() => requestSort('name')}>Cliente</th>
                <th className="px-2 py-2 text-center font-medium text-gray-800">
                  <div className="flex items-center justify-center gap-1">
                    <span className="cursor-pointer hover:bg-gray-200 px-1 rounded" onClick={() => requestSort('professionalLabel')}>Etiq</span>
                    <select 
                      value={filterLabel} 
                      onChange={e => setFilterLabel(e.target.value)}
                      className="text-xs border-gray-300 rounded focus:ring-indigo-500 font-normal p-0 h-5"
                    >
                      <option value="ALL">Todas</option>
                      <option value="F">F</option>
                      <option value="FJ">FJ</option>
                      <option value="JF">JF</option>
                    </select>
                  </div>
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-800 cursor-pointer hover:bg-gray-200" onClick={() => requestSort('currentFee')}>Abono Actual</th>
                {historyDates.map(date => (
                  <th key={date} className="px-2 py-2 text-right font-medium text-gray-700 whitespace-nowrap">{date}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5 + historyDates.length} className="px-2 py-8 text-center text-gray-700">Cargando...</td></tr>
              ) : (
                filteredAndSortedClientes.map((c) => {
                  const currentValue = ediciones[c.id] !== undefined ? ediciones[c.id] : c.currentFee;
                  const isEdited = ediciones[c.id] !== undefined;

                  return (
                    <tr key={c.id} className={`${isEdited ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-2 py-1 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelection(c.id)}
                          className="rounded border-gray-300 text-indigo-600"
                        />
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-gray-900">{c.code}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium truncate max-w-[200px]" title={c.name}>{c.name}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-center">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-bold ${
                          c.professionalLabel === 'F' ? 'bg-green-200 text-green-900' : 
                          c.professionalLabel === 'FJ' ? 'bg-orange-200 text-orange-900' : 
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {c.professionalLabel}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">
                        <input 
                          type="number"
                          min="0"
                          step="1"
                          value={currentValue}
                          onChange={(e) => handleFeeChange(c.id, e.target.value)}
                          className="w-24 text-right rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm p-1 border font-bold text-gray-900 bg-transparent"
                        />
                      </td>
                      {historyDates.map(month => {
                        // Buscar si el cliente tiene un cargo en este mes
                        const tx = c.accountTransactions?.find(t => t.date.startsWith(month));
                        return (
                          <td key={month} className="px-2 py-1 whitespace-nowrap text-right text-gray-800 font-semibold">
                            {tx ? tx.amount.toLocaleString('es-AR') : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
            {/* Totales */}
            <tfoot className="bg-gray-100 font-bold sticky bottom-0 z-10 border-t-2 border-gray-300">
              <tr>
                <td colSpan={3} className="px-2 py-2 text-right">
                  Totales ({totales.countGeneral} Abonos)
                </td>
                <td className="px-2 py-2 text-center text-gray-700">100%</td>
                <td className="px-2 py-2 text-right text-indigo-900">{totales.General.toLocaleString('es-AR')}</td>
                <td colSpan={historyDates.length}></td>
              </tr>
              <tr>
                <td colSpan={3} className="px-2 py-1 text-right text-green-800">
                  Total F ({totales.countF} | {totales.countGeneral ? ((totales.countF / totales.countGeneral) * 100).toFixed(1) : 0}%)
                </td>
                <td className="px-2 py-1 text-center">
                  <span className="text-green-900 px-1 rounded text-xs">{totales.General ? ((totales.F / totales.General) * 100).toFixed(1) : 0}%</span>
                </td>
                <td className="px-2 py-1 text-right text-green-900">{totales.F.toLocaleString('es-AR')}</td>
                <td colSpan={historyDates.length}></td>
              </tr>
              <tr>
                <td colSpan={3} className="px-2 py-1 text-right text-orange-800">
                  Total FJ ({totales.countFJ} | {totales.countGeneral ? ((totales.countFJ / totales.countGeneral) * 100).toFixed(1) : 0}%)
                </td>
                <td className="px-2 py-1 text-center">
                  <span className="text-orange-900 px-1 rounded text-xs">{totales.General ? ((totales.FJ / totales.General) * 100).toFixed(1) : 0}%</span>
                </td>
                <td className="px-2 py-1 text-right text-orange-900">{totales.FJ.toLocaleString('es-AR')}</td>
                <td colSpan={historyDates.length}></td>
              </tr>
              <tr>
                <td colSpan={3} className="px-2 py-1 text-right text-blue-800">
                  Total JF ({totales.countJF} | {totales.countGeneral ? ((totales.countJF / totales.countGeneral) * 100).toFixed(1) : 0}%)
                </td>
                <td className="px-2 py-1 text-center">
                  <span className="text-blue-900 px-1 rounded text-xs">{totales.General ? ((totales.JF / totales.General) * 100).toFixed(1) : 0}%</span>
                </td>
                <td className="px-2 py-1 text-right text-blue-900">{totales.JF.toLocaleString('es-AR')}</td>
                <td colSpan={historyDates.length}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
