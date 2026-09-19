"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Users, FileText, Wallet, BarChart3, UserCheck, Settings, Menu, X, LogOut } from 'lucide-react';

export default function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-black text-white px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo-dark.png" alt="EC" className="h-8 object-contain" />
          <span className="font-bold text-sm tracking-wider">ESTUDIO</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 text-gray-300 hover:text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black text-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <img src="/logo-dark.png" alt="EC" className="h-10 object-contain" />
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-300 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center rounded-lg px-4 py-4 transition-colors ${isActive ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="ml-4 font-medium text-lg">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-800 pb-8">
            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded-lg px-4 py-4 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <LogOut className="h-6 w-6" />
              <span className="ml-4 font-medium text-lg">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:flex h-full flex-col bg-black text-white transition-all duration-300 shrink-0 ${isHovered ? 'w-64' : 'w-20'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex h-20 items-center justify-center border-b border-gray-800 px-4">
          {isHovered ? (
            <img src="/logo-dark.png" alt="Estudio Jurídico Contable" className="h-14 object-contain" />
          ) : (
            <div className="w-10 h-10 overflow-hidden relative">
              <img src="/logo-dark.png" alt="EC" className="h-14 absolute top-1/2 left-0 -translate-y-1/2" style={{ maxWidth: 'max-content' }} />
            </div>
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
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title={!isHovered ? 'Cerrar Sesión' : undefined}
          >
            <LogOut className="h-5 w-5 min-w-[20px]" />
            {isHovered && <span className="ml-3 whitespace-nowrap overflow-hidden">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </>
  );
}
