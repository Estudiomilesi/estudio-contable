import React from 'react';
import Link from 'next/link';

export default function ReportesDashboard() {
  const links = [
    {
      title: "Ranking de Facturación",
      description: "Comparativa de los últimos 6 meses de facturación por cliente, con totales acumulados.",
      href: "/reportes/ranking?tipo=facturado",
      icon: "📈",
      color: "bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100"
    },
    {
      title: "Ranking de Cobranzas",
      description: "Comparativa de los últimos 6 meses de cobranzas reales por cliente, con totales acumulados.",
      href: "/reportes/ranking?tipo=cobrado",
      icon: "💰",
      color: "bg-green-50 border-green-200 text-green-900 hover:bg-green-100"
    },
    {
      title: "Cierre de Mes (P&L)",
      description: "Estado de resultados mensual, distribución de gastos, saldos y retiros de socios.",
      href: "/reportes/fin-de-mes",
      icon: "⚖️",
      color: "bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100"
    },
    {
      title: "Detalle del Mes (Dashboard)",
      description: "Listado cronológico de facturación o cobranza del mes en curso.",
      href: "/reportes/mes?tipo=cobrado",
      icon: "📅",
      color: "bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Módulo de Reportes</h1>
        <p className="text-gray-600 mt-2">Centro de análisis y resultados del estudio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {links.map(link => (
          <Link href={link.href} key={link.title}>
            <div className={`p-6 rounded-xl border ${link.color} transition-all cursor-pointer flex gap-4 h-full`}>
              <div className="text-4xl">{link.icon}</div>
              <div>
                <h3 className="text-lg font-bold">{link.title}</h3>
                <p className="mt-1 opacity-80 text-sm font-medium">{link.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
