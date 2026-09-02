"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Users, FileText, Wallet, BarChart3, UserCheck, ChevronRight, ChevronLeft } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Abonos', path: '/facturacion', icon: FileText },
    { name: 'Comprobantes', path: '/comprobantes', icon: FileText },
    { name: 'Cuentas Corrientes', path: '/cuentas-corrientes', icon: UserCheck },
    { name: 'Tesorería', path: '/tesoreria', icon: Wallet },
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
    </div>
  );
}
