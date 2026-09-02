import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, date, dueDate, concept, amount } = body;

    if (!clientId || !date || !concept || !amount) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const txDate = new Date(date);
    const txDueDate = dueDate ? new Date(dueDate) : txDate;
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Importe inválido' }, { status: 400 });
    }

    const transaction = await prisma.accountTransaction.create({
      data: {
        clientId,
        type: 'CHARGE',
        amount: parsedAmount,
        date: txDate,
        dueDate: txDueDate,
        description: concept,
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al emitir comprobante' }, { status: 500 });
  }
}
