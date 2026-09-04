"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Users, FileText, Wallet, BarChart3, UserCheck, ChevronRight, ChevronLeft, Settings } from 'lucide-react';

export default function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Abonos', path: '/facturacion', icon: FileText },
    { name: 'Comprobantes', path: '/comprobantes', icon: FileText },
    { name: 'Cuentas Corrientes', path: '/cuentas-corrientes', icon: UserCheck },
    { name: 'Tesorería', path: '/tesoreria', icon: Wallet },
    ...(userRole === 'ADMIN' ? [
      { name: 'Sueldos', path: '/sueldos', icon: Users },
      { name: 'Configuración', path: '/configuracion', icon: Settings }
    ] : []),
    { name: 'Reportes', path: '/reportes', icon: BarChart3 },
  ];

  return (
    <div 
      className={`flex h-full flex-col bg-gray-900 text-white transition-all duration-300 ${isHovered ? 'w-64' : 'w-20'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-4">
        {isHovered ? (
          <h1 className="text-xl font-bold whitespace-nowrap overflow-hidden">Estudio Contable</h1>
        ) : (
          <span className="text-xl font-bold">EC</span>
        )}
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`flex items-center rounded-lg px-4 py-3 transition-colors ${isActive ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}
              title={!isHovered ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 min-w-[20px]" />
              {isHovered && <span className="ml-3 whitespace-nowrap overflow-hidden">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className={`flex w-full items-center rounded-lg px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors`}
          title={!isHovered ? 'Cerrar Sesión' : undefined}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 min-w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isHovered && <span className="ml-3 whitespace-nowrap overflow-hidden">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}
