export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard General</h1>
      <p className="text-gray-700">Bienvenido al sistema de gestión del Estudio Contable.</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700">Total Clientes</h3>
          <p className="mt-2 text-3xl font-bold">140</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700">Facturación Estimada</h3>
          <p className="mt-2 text-3xl font-bold">$ 37.6M</p>
        </div>
      </div>
    </div>
  );
}
