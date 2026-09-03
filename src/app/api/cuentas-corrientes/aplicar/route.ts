import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recalculatePaymentIva } from '@/lib/iva';

export async function POST(request: Request) {
  try {
    const { paymentId, chargeId, amount } = await request.json();

    if (!paymentId || !chargeId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Datos incompletos o inválidos' }, { status: 400 });
    }

    const application = await prisma.paymentApplication.create({
      data: {
        paymentId,
        chargeId,
        amount: parseFloat(amount)
      }
    });

    await recalculatePaymentIva(paymentId);

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al aplicar el pago' }, { status: 500 });
  }
}
