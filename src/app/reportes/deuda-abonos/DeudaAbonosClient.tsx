"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpDown } from 'lucide-react';

type ClientDebt = {
  clientId: string;
  code: string;
  name: string;
  label: string;
  totalDebt: number;
  monthsCount: number;
  monthsDebt: Record<string, number>;
};

type SortField = 'name' | 'code' | 'label' | 'totalDebt' | 'monthsCount';
type SortOrder = 'asc' | 'desc';

export default function DeudaAbonosClient({ 
  data, 
  months,
  isJuanma
}: { 
  data: ClientDebt[];
  months: { key: string, label: string }[];
  isJuanma: boolean;
}) {
  const [filterLabel, setFilterLabel] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('totalDebt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'totalDebt' || field === 'monthsCount' ? 'desc' : 'asc');
    }
  };

  const filteredData = useMemo(() => {
    let filtered = [...data];
    if (filterLabel !== 'ALL') {
      filtered = filtered.filter(d => d.label === filterLabel);
    }
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === 'label') {
        comparison = (a.label || '').localeCompare(b.label || '');
      } else if (sortField === 'totalDebt') {
        comparison = a.totalDebt - b.totalDebt;
      } else if (sortField === 'monthsCount') {
        comparison = a.monthsCount - b.monthsCount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder, filterLabel]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reportes" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Deuda de Abonos por Cliente</h1>
            <p className="text-gray-600 mt-2">Detalle de meses impagos de abonos mensuales.</p>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Filtrar por etiqueta:</label>
          <select 
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
            className="rounded-md border border-gray-300 py-1 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="ALL">Todas las etiquetas</option>
            {!isJuanma && <option value="F">Solo Estudio F</option>}
            <option value="FJ">FJ</option>
            <option value="JF">JF</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[75vh]">
        <div className="overflow-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200 relative">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm outline outline-1 outline-gray-200">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center gap-1">
                    Código <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('label')}
                >
                  <div className="flex items-center gap-1">
                    Etiqueta <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Cliente <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('monthsCount')}
                  title="Cantidad de meses de deuda"
                >
                  <div className="flex items-center justify-center gap-1">
                    Meses <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalDebt')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Deuda Total <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                {months.map(m => (
                  <th 
                    key={m.key} 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                  >
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5 + months.length} className="px-6 py-8 text-center text-gray-500">
                    No hay clientes con deuda de abonos mensuales.
                  </td>
                </tr>
              ) : (
                filteredData.map((client) => (
                  <tr key={client.clientId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
                      {client.label || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {client.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-orange-600 bg-orange-50/30">
                      {client.monthsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600 bg-red-50/30">
                      {formatCurrency(client.totalDebt)}
                    </td>
                    {months.map(m => {
                      const amount = client.monthsDebt[m.key];
                      return (
                        <td key={m.key} className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {amount ? formatCurrency(amount) : <span className="text-gray-300">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-100 font-bold sticky bottom-0 z-10 outline outline-1 outline-gray-300">
                <tr>
                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    TOTAL GENERAL:
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700 bg-red-100/50">
                    {formatCurrency(filteredData.reduce((acc, curr) => acc + curr.totalDebt, 0))}
                  </td>
                  {months.map(m => {
                    const totalMonth = filteredData.reduce((acc, curr) => acc + (curr.monthsDebt[m.key] || 0), 0);
                    return (
                      <td key={m.key} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {totalMonth > 0 ? formatCurrency(totalMonth) : '-'}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
