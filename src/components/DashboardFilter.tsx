"use client";

import { useRouter } from 'next/navigation';

export default function DashboardFilter({ currentLabel }: { currentLabel: string }) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ALL') {
      router.push('/');
    } else {
      router.push("/?label=" + val);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="labelFilter" className="text-sm font-semibold text-gray-700">Filtrar por Etiqueta:</label>
      <select 
        id="labelFilter"
        value={currentLabel} 
        onChange={handleChange}
        className="rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500 font-medium text-gray-900 shadow-sm"
      >
        <option value="ALL">Todas las etiquetas</option>
        <option value="F">F</option>
        <option value="FJ_JF">FJ + JF</option>
        <option value="FJ">Solo FJ</option>
        <option value="JF">Solo JF</option>
      </select>
    </div>
  );
}
