import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const transactions = data.transactions;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'No se enviaron comprobantes para importar' }, { status: 400 });
    }

    const created = await prisma.$transaction(
      transactions.map((tx: any) => {
        return prisma.accountTransaction.create({
          data: {
            clientId: tx.clientId,
            date: new Date(tx.date),
            type: tx.type,
            billingProfile: tx.billingProfile,
            netAmount: tx.netAmount,
            ivaAmount: tx.ivaAmount,
            amount: tx.amount,
            description: tx.description,
            receiptNumber: tx.receiptNumber || null,
            collaboratorName: tx.collaboratorName || null,
            collaboratorAmount: tx.collaboratorAmount || null,
            cae: tx.cae || null,
            caeDueDate: tx.caeDueDate ? new Date(tx.caeDueDate) : null
          }
        });
      })
    );

    return NextResponse.json({ success: true, count: created.length });
  } catch (error: any) {
    console.error('Error importing AFIP comprobantes:', error);
    return NextResponse.json({ error: 'Error al importar: ' + error.message }, { status: 500 });
  }
}
