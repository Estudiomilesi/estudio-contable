import { prisma } from '@/lib/prisma';
import React from 'react';
import ClientDirectory from './ClientDirectory';

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

  return <ClientDirectory clients={activeClients} />;
}
