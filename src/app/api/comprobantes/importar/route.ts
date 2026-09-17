import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const transactions = data.transactions;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'No se enviaron comprobantes para importar' }, { status: 400 });
    }

    let count = 0;

    // Procesar cada comprobante
    for (const tx of transactions) {
      // 1. Intentar hacer matching con un ABON- pendiente (generado por facturación masiva)
      // Criterios: mismo cliente, es un CARGO (CHARGE), está pendiente de envío (isEmailed=false),
      // el monto neto o total coincide aproximadamente (±5 pesos por redondeos), 
      // y el número de comprobante actual empieza con ABON-.
      const existingPending = await prisma.accountTransaction.findFirst({
        where: {
          clientId: tx.clientId,
          type: 'CHARGE',
          isEmailed: false,
          receiptNumber: { startsWith: 'ABON-' },
          // Relajamos la fecha: que sea del mismo mes/año aprox (los últimos 45 días)
          date: { gte: new Date(new Date().getTime() - 45 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { date: 'desc' }
      });

      // Validar si el monto coincide (±5 pesos)
      let isAmountMatch = false;
      if (existingPending) {
        const diffTotal = Math.abs(existingPending.amount - tx.amount);
        const diffNeto = Math.abs(existingPending.netAmount - tx.netAmount);
        if (diffTotal <= 5 || diffNeto <= 5) {
          isAmountMatch = true;
        }
      }

      if (existingPending && isAmountMatch) {
        // ACTUALIZAR el comprobante existente con los datos oficiales de AFIP
        await prisma.accountTransaction.update({
          where: { id: existingPending.id },
          data: {
            date: new Date(tx.date), // Actualizamos con la fecha real del PDF AFIP
            netAmount: tx.netAmount,
            ivaAmount: tx.ivaAmount,
            amount: tx.amount, // Ajustamos importes exactos
            description: tx.description, // Pasa a llamarse "Factura 000X-000000X"
            receiptNumber: tx.receiptNumber, // Reemplaza ABON-00X
            cae: tx.cae || null,
            caeDueDate: tx.caeDueDate ? new Date(tx.caeDueDate) : null,
            afipTipoCmp: tx.afipTipoCmp || null,
            // OJO: Se mantiene isEmailed: false para que Fede pueda mandarlo manualmente luego
          }
        });
        count++;
      } else {
        // CREAR un comprobante nuevo
        await prisma.accountTransaction.create({
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
            caeDueDate: tx.caeDueDate ? new Date(tx.caeDueDate) : null,
            afipTipoCmp: tx.afipTipoCmp || null
          }
        });
        count++;
      }
    }

    return NextResponse.json({ success: true, count: count });
  } catch (error: any) {
    console.error('Error importing AFIP comprobantes:', error);
    return NextResponse.json({ error: 'Error al importar: ' + error.message }, { status: 500 });
  }
}
