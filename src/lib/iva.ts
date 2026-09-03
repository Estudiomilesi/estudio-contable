import { prisma } from '@/lib/prisma';

export async function recalculatePaymentIva(paymentId: string) {
  // Buscar todas las aplicaciones del pago
  const applications = await prisma.paymentApplication.findMany({
    where: { paymentId },
    include: { charge: true }
  });

  let totalIvaCollected = 0;
  let totalNetCollected = 0;

  for (const app of applications) {
    const charge = app.charge;
    if (charge.amount > 0) {
      // Proporción del IVA en este cargo
      const ivaRatio = charge.ivaAmount / charge.amount;
      const netRatio = charge.netAmount / charge.amount;
      
      totalIvaCollected += app.amount * ivaRatio;
      totalNetCollected += app.amount * netRatio;
    }
  }

  // Actualizar el pago con los montos separados
  await prisma.accountTransaction.update({
    where: { id: paymentId },
    data: {
      ivaAmount: totalIvaCollected,
      netAmount: totalNetCollected
    }
  });
}
