"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpDown } from 'lucide-react';

type ClientDebt = {
  clientId: string;
  code: string;
  name: string;
  totalDebt: number;
  monthsDebt: Record<string, number>;
};

type SortField = 'name' | 'code' | 'totalDebt';
type SortOrder = 'asc' | 'desc';

export default function DeudaAbonosClient({ 
  data, 
  months 
}: { 
  data: ClientDebt[];
  months: { key: string, label: string }[];
}) {
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
      setSortOrder(field === 'totalDebt' ? 'desc' : 'asc');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === 'totalDebt') {
        comparison = a.totalDebt - b.totalDebt;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder]);

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
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Cliente <ArrowUpDown className="h-3 w-3" />
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
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={3 + months.length} className="px-6 py-8 text-center text-gray-500">
                    No hay clientes con deuda de abonos mensuales.
                  </td>
                </tr>
              ) : (
                sortedData.map((client) => (
                  <tr key={client.clientId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {client.name}
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
          </table>
        </div>
      </div>
    </div>
  );
}
