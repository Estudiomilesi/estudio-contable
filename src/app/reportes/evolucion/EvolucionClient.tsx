"use client";

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart
} from 'recharts';

type MonthData = {
  monthStr: string;
  label: string;
  facturacion: number;
  cobranza: number;
  gastosTotal: number;
  gastosPorConcepto: Record<string, number>;
};

export default function EvolucionClient({ 
  data, 
  categoriasGastos 
}: { 
  data: MonthData[];
  categoriasGastos: string[];
}) {

  // Aplanar los datos para los gráficos
  const chartData = useMemo(() => {
    return data.map(d => {
      const flattened: any = {
        name: d.label,
        'Facturación': d.facturacion,
        'Cobranza': d.cobranza,
        'Gastos Totales': d.gastosTotal,
      };
      
      // Añadir cada categoría de gasto para el gráfico apilado
      categoriasGastos.forEach(cat => {
        flattened[`Gasto: ${cat}`] = d.gastosPorConcepto[cat] || 0;
      });

      return flattened;
    });
  }, [data, categoriasGastos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generar colores distintos para las categorías
  const COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#d946ef', // fuchsia
    '#f43f5e', // rose
  ];

  return (
    <div className="space-y-8">
      {/* Gráfico 1: Facturación vs Cobranza (Evolución) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Facturación vs Cobranza Neta</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis 
                tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} 
                tick={{fill: '#6b7280', fontSize: 12}} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                formatter={(value: any) => formatCurrency(Number(value) || 0)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Facturación" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Line type="monotone" dataKey="Cobranza" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Evolución de Gastos por Concepto (Apilado) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Estructura de Gastos Operativos</h2>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis 
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                tick={{fill: '#6b7280', fontSize: 12}} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                formatter={(value: any) => formatCurrency(Number(value) || 0)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              {categoriasGastos.map((cat, index) => (
                <Bar 
                  key={cat} 
                  dataKey={`Gasto: ${cat}`} 
                  stackId="a" 
                  fill={COLORS[index % COLORS.length]} 
                  maxBarSize={50}
                  radius={
                    // Redondear la barra superior si es la última categoría en este mes (complejo en recharts, mejor dejar plano o sin radius)
                    [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla resumen de datos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Tabla de Datos Mensuales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Facturación Neta</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cobranza Neta</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos Totales</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...data].reverse().map((d) => (
                <tr key={d.monthStr} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{d.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-indigo-600">{formatCurrency(d.facturacion)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">{formatCurrency(d.cobranza)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">{formatCurrency(d.gastosTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
