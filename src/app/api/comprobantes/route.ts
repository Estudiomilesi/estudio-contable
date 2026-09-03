import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, date, dueDate, concept, amount, comprobanteType, billingProfile } = body;

    if (!clientId || !date || !concept || !amount || !comprobanteType) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const txDate = new Date(date);
    const txDueDate = dueDate ? new Date(dueDate) : txDate;
    const netAmount = parseFloat(amount);

    if (isNaN(netAmount) || netAmount <= 0) {
      return NextResponse.json({ error: 'Importe inválido' }, { status: 400 });
    }

    const ivaAmount = billingProfile === 'FEDE_RI' ? netAmount * 0.21 : 0;
    const totalAmount = netAmount + ivaAmount;

    const transaction = await prisma.accountTransaction.create({
      data: {
        clientId,
        type: comprobanteType === 'NOTA_CREDITO' ? 'PAYMENT' : 'CHARGE',
        amount: totalAmount,
        netAmount,
        ivaAmount,
        billingProfile: billingProfile || 'NO_FISCAL',
        date: txDate,
        dueDate: comprobanteType === 'NOTA_CREDITO' ? null : txDueDate,
        description: comprobanteType === 'NOTA_CREDITO' ? `NC: ${concept}` : concept,
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al emitir comprobante' }, { status: 500 });
  }
}
