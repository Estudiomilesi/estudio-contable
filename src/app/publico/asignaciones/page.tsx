import { prisma } from '@/lib/prisma';
import React from 'react';

// Force dynamic rendering so the page always fetches fresh data from DB on every request.
export const dynamic = 'force-dynamic';

export default async function AsignacionesPublicasPage() {
  const activeClients = await prisma.client.findMany({
    where: { 
      isActive: true,
      hasAbono: true // Usually assigned collaborators only matter for clients with an abono
    },
    select: {
      id: true,
      code: true,
      name: true,
      assignedCollaborator: true,
    },
    orderBy: [
      { assignedCollaborator: 'asc' },
      { name: 'asc' }
    ]
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Directorio de Asignaciones</h1>
            <p className="text-indigo-100 text-sm mt-1">
              Listado de clientes activos y sus colaboradores asignados.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nombre del Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Colaborador Asignado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {client.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {client.assignedCollaborator ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {client.assignedCollaborator}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Sin asignar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {activeClients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No hay clientes activos para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 text-right">
            Actualizado en tiempo real
          </div>
        </div>
      </div>
    </div>
  );
}
