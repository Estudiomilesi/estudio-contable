import { prisma } from '@/lib/prisma';
import EvolucionClient from './EvolucionClient';

export const dynamic = 'force-dynamic';

export default async function EvolucionPage() {
  const { headers } = await import('next/headers');
  const isJuanma = (await headers()).get('x-is-juanma') === 'true';

  // Últimos 13 meses
  const today = new Date();
  // El mes actual cuenta como 1, así que vamos 12 meses para atrás
  const startDate = new Date(today.getFullYear(), today.getMonth() - 12, 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const whereClient = isJuanma ? { professionalLabel: { in: ['FJ', 'JF'] as any } } : {};

  // 1. Facturación (CHARGE)
  const facturacion = await prisma.accountTransaction.findMany({
    where: {
      type: 'CHARGE',
      date: { gte: startDate, lte: endDate },
      client: whereClient
    },
    select: { date: true, netAmount: true, amount: true }
  });

  // 2. Cobranza (PAYMENT)
  const cobranza = await prisma.accountTransaction.findMany({
    where: {
      type: 'PAYMENT',
      date: { gte: startDate, lte: endDate },
      NOT: [
        { description: { startsWith: 'NC' } },
        { description: { contains: 'aldo a favor' } }
      ],
      client: whereClient
    },
    select: { date: true, netAmount: true, amount: true }
  });

  // Inject manual Treasury cobranzas
  const treasuryCobranza = await prisma.treasuryTransaction.findMany({
    where: {
      category: 'Honorarios',
      date: { gte: startDate, lte: endDate },
      description: { in: ['Migración inicial', '181.500 Honorarios 38.115 IVA', '532.500 honorarios, 111.825 IVA'] },
      ...(isJuanma && { client: { professionalLabel: { in: ['FJ', 'JF'] as any } } })
    },
    select: { date: true, amount: true, description: true }
  });

  const allCobranzas = [
    ...cobranza, 
    ...treasuryCobranza.map(t => {
      let net = t.amount;
      if (t.description === '181.500 Honorarios 38.115 IVA') net = 181500;
      if (t.description === '532.500 honorarios, 111.825 IVA') net = 532500;
      return { date: t.date, netAmount: net, amount: t.amount };
    })
  ];

  // 3. Gastos (EXPENSE) - solo tesorería, ignorando los retiros si no es un "gasto" real?
  // Ojo: los retiros de los socios NO son un gasto del estudio, son retiros de utilidades.
  // Fede dijo "y los gastos por concepto y total"
  const gastosTesoreria = await prisma.treasuryTransaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      type: 'EXPENSE',
      NOT: [
        { category: 'Retiro Fede' },
        { category: 'Retiro Juanma' }
      ]
    },
    select: { date: true, amount: true, category: true }
  });

  // Agrupar todo por mes (YYYY-MM)
  const monthlyData: Record<string, {
    monthStr: string,
    label: string,
    facturacion: number,
    cobranza: number,
    gastosTotal: number,
    gastosPorConcepto: Record<string, number>
  }> = {};

  // Inicializar los 13 meses para que el gráfico no tenga huecos
  for (let i = 12; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = d.toISOString().substring(0, 7);
    let label = new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' }).format(d);
    label = label.charAt(0).toUpperCase() + label.slice(1);

    monthlyData[monthKey] = {
      monthStr: monthKey,
      label,
      facturacion: 0,
      cobranza: 0,
      gastosTotal: 0,
      gastosPorConcepto: {}
    };
  }

  // Llenar facturación
  facturacion.forEach(f => {
    const monthKey = f.date.toISOString().substring(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].facturacion += (f.netAmount || f.amount);
    }
  });

  // Llenar cobranza
  allCobranzas.forEach(c => {
    const monthKey = c.date.toISOString().substring(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].cobranza += (c.netAmount || c.amount);
    }
  });

  // Llenar gastos
  gastosTesoreria.forEach(g => {
    const monthKey = g.date.toISOString().substring(0, 7);
    if (monthlyData[monthKey]) {
      const amt = Math.abs(g.amount);
      monthlyData[monthKey].gastosTotal += amt;
      
      const cat = g.category || 'Varios';
      if (!monthlyData[monthKey].gastosPorConcepto[cat]) {
        monthlyData[monthKey].gastosPorConcepto[cat] = 0;
      }
      monthlyData[monthKey].gastosPorConcepto[cat] += amt;
    }
  });

  const dataArray = Object.values(monthlyData).sort((a, b) => a.monthStr.localeCompare(b.monthStr));

  // Obtener la lista única de categorías de gastos para el gráfico apilado
  const categoriasSet = new Set<string>();
  gastosTesoreria.forEach(g => categoriasSet.add(g.category || 'Varios'));
  const categoriasGastos = Array.from(categoriasSet).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Evolución Histórica (Últimos 13 Meses)</h1>
        <p className="text-gray-600 mt-2">Tendencia de facturación neta, cobranza neta y estructura de gastos operativos.</p>
      </div>

      <EvolucionClient data={dataArray} categoriasGastos={categoriasGastos} />
    </div>
  );
}
