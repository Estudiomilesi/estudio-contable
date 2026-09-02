import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Estudio Contable</h1>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        <Link href="/" className="block rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors">
          Dashboard
        </Link>
        <Link href="/clientes" className="block rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors">
          Clientes
        </Link>
        <Link href="/facturacion" className="block rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors">
          Facturación (Abonos)
        </Link>
        <Link href="/tesoreria" className="block rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors">
          Tesorería
        </Link>
        <Link href="/reportes" className="block rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors">
          Reportes
        </Link>
      </nav>
    </div>
  );
}
