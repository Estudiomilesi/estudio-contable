import { prisma } from '@/lib/prisma';
import FinDeMesClient from './FinDeMesClient';

export const dynamic = 'force-dynamic';

export default async function FinDeMesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  
  // Determinar el mes a consultar
  const today = new Date();
  const currentMonthStr = today.toISOString().substring(0, 7);
  const targetMonthStr = params.month || currentMonthStr; // 'YYYY-MM'
  
  const [year, month] = targetMonthStr.split('-').map(Number);
  
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0, 23, 59, 59);

  // Determinar mes anterior (para proporciones de abonos)
  const prevMonthDate = new Date(year, month - 2, 1);
  const firstDayPrev = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
  const lastDayPrev = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59);

  // 1. Proporción de Abonos
  let abonosPeriod = await prisma.accountTransaction.findMany({
    where: {
      type: 'CHARGE',
      date: { gte: firstDayPrev, lte: lastDayPrev },
      description: { contains: 'Abono Mensual' }
    },
    include: { client: { select: { professionalLabel: true } } }
  });

  // Si no hay abonos en el mes anterior, buscar el último mes conocido con abonos
  if (abonosPeriod.length === 0) {
    const lastAbono = await prisma.accountTransaction.findFirst({
      where: {
        type: 'CHARGE',
        date: { lt: firstDayPrev },
        description: { contains: 'Abono Mensual' }
      },
      orderBy: { date: 'desc' }
    });

    if (lastAbono) {
      const knownYear = lastAbono.date.getFullYear();
      const knownMonth = lastAbono.date.getMonth(); // 0-indexed
      const knownFirstDay = new Date(knownYear, knownMonth, 1);
      const knownLastDay = new Date(knownYear, knownMonth + 1, 0, 23, 59, 59);

      abonosPeriod = await prisma.accountTransaction.findMany({
        where: {
          type: 'CHARGE',
          date: { gte: knownFirstDay, lte: knownLastDay },
          description: { contains: 'Abono Mensual' }
        },
        include: { client: { select: { professionalLabel: true } } }
      });
    }
  }

  let totalAbonosF = 0;
  let totalAbonosFJ = 0;
  let totalAbonos = 0;

  abonosPeriod.forEach(a => {
    const amt = a.netAmount || a.amount;
    totalAbonos += amt;
    if (a.client?.professionalLabel === 'F') totalAbonosF += amt;
    else if (a.client?.professionalLabel === 'FJ' || a.client?.professionalLabel === 'JF') totalAbonosFJ += amt;
  });

  let propF = totalAbonos > 0 ? totalAbonosF / totalAbonos : 0;
  let propFJ = totalAbonos > 0 ? totalAbonosFJ / totalAbonos : 0;

  // Fallback definitivo a los porcentajes indicados solo si nunca hubo abonos históricos
  if (totalAbonos === 0) {
    propF = 0.365; // F 36.5%
    propFJ = 0.312 + 0.323; // FJ 31.2% + JF 32.3% = 63.5%
  }

  // 2. Cobranzas del mes actual (Ingresos Netos)
  const cobranzas = await prisma.accountTransaction.findMany({
    where: {
      type: 'PAYMENT',
      date: { gte: firstDay, lte: lastDay },
      NOT: [
        { description: { startsWith: 'NC:' } },
        { description: { contains: 'aldo a favor' } }
      ]
    },
    include: { client: { select: { professionalLabel: true } } }
  });

  let ingresosF = 0;
  let ingresosFJ = 0;
  
  cobranzas.forEach(c => {
    const amt = c.netAmount || c.amount;
    if (c.client?.professionalLabel === 'F') ingresosF += amt;
    else if (c.client?.professionalLabel === 'FJ' || c.client?.professionalLabel === 'JF') ingresosFJ += amt;
  });

  // 3. Egresos de Tesorería del mes actual
  const egresos = await prisma.treasuryTransaction.findMany({
    where: {
      type: 'EXPENSE',
      date: { gte: firstDay, lte: lastDay }
    },
    include: { client: { select: { professionalLabel: true } } }
  });

  const gastos = { F: 0, FJ: 0, Consolidado: 0 };
  const gastosDetalle: any[] = [];
  let retirosFede = 0;
  let retirosJuanma = 0;

  egresos.forEach(e => {
    if (e.category === 'Retiro Fede') {
      retirosFede += e.amount;
    } else if (e.category === 'Retiro Juanma') {
      retirosJuanma += e.amount;
    } else if (e.category === 'Participacion') {
      // Gastos directos al ER correspondiente
      if (e.client?.professionalLabel === 'F') {
        gastos.F += e.amount;
      } else if (e.client?.professionalLabel === 'FJ' || e.client?.professionalLabel === 'JF') {
        gastos.FJ += e.amount;
      }
      gastos.Consolidado += e.amount;
      gastosDetalle.push({ ...e, assignedTo: e.client?.professionalLabel === 'F' ? 'F' : 'FJ' });
    } else {
      // Gastos comunes prorrateables (Sueldos, Alquiler, Sistemas, etc)
      gastos.F += e.amount * propF;
      gastos.FJ += e.amount * propFJ;
      gastos.Consolidado += e.amount;
      gastosDetalle.push({ ...e, assignedTo: 'PRORRATEO' });
    }
  });

  // 4. Participaciones Pendientes (Alerta)
  // Cobros de este mes aplicados a facturas que tenían "Participación"
  // Para esto, buscaremos los PAYMENT de este mes, sus applications, y si el CHARGE original tenía participacion
  const paymentsConParticipacion = await prisma.accountTransaction.findMany({
    where: {
      type: 'PAYMENT',
      date: { gte: firstDay, lte: lastDay },
      paymentsApplied: {
        some: {
          charge: { collaboratorAmount: { gt: 0 } }
        }
      }
    },
    include: {
      client: { select: { name: true } },
      paymentsApplied: {
        include: {
          charge: { select: { collaboratorName: true, collaboratorAmount: true, description: true } }
        }
      }
    }
  });

  // Mapear alertas
  const alertasParticipacion: any[] = [];
  paymentsConParticipacion.forEach(p => {
    p.paymentsApplied.forEach(app => {
      if (app.charge.collaboratorAmount && app.charge.collaboratorAmount > 0) {
        alertasParticipacion.push({
          paymentId: p.id,
          date: p.date,
          clientName: p.client.name,
          collaboratorName: app.charge.collaboratorName,
          amount: app.charge.collaboratorAmount,
          chargeDesc: app.charge.description
        });
      }
    });
  });

  return (
    <FinDeMesClient 
      targetMonthStr={targetMonthStr}
      propF={propF}
      propFJ={propFJ}
      ingresosF={ingresosF}
      ingresosFJ={ingresosFJ}
      gastosF={gastos.F}
      gastosFJ={gastos.FJ}
      gastosConsolidado={gastos.Consolidado}
      retirosFede={retirosFede}
      retirosJuanma={retirosJuanma}
      gastosDetalle={gastosDetalle}
      alertasParticipacion={alertasParticipacion}
    />
  );
}
