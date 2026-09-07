import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recalculatePaymentIva } from '@/lib/iva';

export async function POST(request: Request) {
  try {
    const { paymentId, chargeIds } = await request.json(); // Changed from chargeId to chargeIds

    if (!paymentId || !chargeIds || !Array.isArray(chargeIds) || chargeIds.length === 0) {
      return NextResponse.json({ error: 'Datos incompletos o inválidos' }, { status: 400 });
    }

    // Obtener el pago y calcular saldo disponible
    const payment = await prisma.accountTransaction.findUnique({
      where: { id: paymentId },
      include: { chargesCovered: true }
    });

    if (!payment || payment.type !== 'PAYMENT') {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    const alreadyAppliedToPayment = payment.chargesCovered.reduce((sum, app) => sum + app.amount, 0);
    let remainingPayment = payment.amount - alreadyAppliedToPayment;

    if (remainingPayment <= 0.001) {
      return NextResponse.json({ error: 'El comprobante ya está totalmente aplicado' }, { status: 400 });
    }

    const charges = await prisma.accountTransaction.findMany({
      where: { id: { in: chargeIds } },
      include: { paymentsApplied: true },
      orderBy: { date: 'asc' }
    });

    const createdApplications = [];

    for (const charge of charges) {
      if (remainingPayment <= 0.001) break;

      const appliedToCharge = charge.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
      const chargeDebt = charge.amount - appliedToCharge;

      if (chargeDebt > 0.001) {
        const amountToApply = Math.min(remainingPayment, chargeDebt);
        
        const newApp = await prisma.paymentApplication.create({
          data: {
            chargeId: charge.id,
            paymentId: payment.id,
            amount: amountToApply
          }
        });
        
        createdApplications.push(newApp);
        remainingPayment -= amountToApply;
      }
    }

    await recalculatePaymentIva(paymentId);

    return NextResponse.json({ success: true, appliedCount: createdApplications.length }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al aplicar el pago' }, { status: 500 });
  }
}
