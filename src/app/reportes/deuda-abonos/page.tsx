import { prisma } from '@/lib/prisma';
import DeudaAbonosClient from './DeudaAbonosClient';

export const dynamic = 'force-dynamic';

export default async function DeudaAbonosPage() {
  const { headers } = await import('next/headers');
  const isJuanma = (await headers()).get('x-is-juanma') === 'true';

  const whereClient = isJuanma ? { professionalLabel: { in: ['FJ', 'JF'] as any } } : {};

  // Buscar todos los cargos de tipo Abono Mensual que no estén completamente pagados
  const cargosAbono = await prisma.accountTransaction.findMany({
    where: {
      type: 'CHARGE',
      description: { contains: 'Abono Mensual' },
      client: whereClient
    },
    include: {
      client: { select: { id: true, code: true, name: true, professionalLabel: true } },
      paymentsApplied: { select: { amount: true } }
    },
    orderBy: { date: 'desc' }
  });

  const rawData: Record<string, {
    clientId: string,
    code: string,
    name: string,
    label: string,
    totalDebt: number,
    monthsCount: number,
    monthsDebt: Record<string, number>
  }> = {};

  const allMonthsSet = new Set<string>();

  cargosAbono.forEach(charge => {
    // Calcular deuda del cargo
    const pagado = charge.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
    const deuda = charge.amount - pagado;

    // Considerar deuda si es mayor a 1 centavo
    if (deuda > 0.01) {
      if (!rawData[charge.clientId]) {
        rawData[charge.clientId] = {
          clientId: charge.clientId,
          code: charge.client.code,
          name: charge.client.name,
          label: charge.client.professionalLabel,
          totalDebt: 0,
          monthsCount: 0,
          monthsDebt: {}
        };
      }

      // Obtener mes (YYYY-MM)
      const d = new Date(charge.date);
      // Para evitar problemas de zona horaria y porque los abonos están a las 12:00 UTC
      const monthKey = d.toISOString().substring(0, 7);
      
      allMonthsSet.add(monthKey);

      rawData[charge.clientId].totalDebt += deuda;
      
      if (!rawData[charge.clientId].monthsDebt[monthKey]) {
        rawData[charge.clientId].monthsDebt[monthKey] = 0;
        rawData[charge.clientId].monthsCount = (rawData[charge.clientId].monthsCount || 0) + 1;
      }
      rawData[charge.clientId].monthsDebt[monthKey] += deuda;
    }
  });

  // Ordenar meses de más nuevo a más viejo
  const months = Array.from(allMonthsSet).sort((a, b) => b.localeCompare(a));
  
  // Mapear etiquetas bonitas para los meses
  const monthLabels = months.map(m => {
    const [year, month] = m.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 15);
    let label = new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' }).format(date);
    return { key: m, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  const clientData = Object.values(rawData);

  return (
    <DeudaAbonosClient 
      data={clientData} 
      months={monthLabels} 
      isJuanma={isJuanma}
    />
  );
}
