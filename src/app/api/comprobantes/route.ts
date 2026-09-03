import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Función auxiliar para extraer número de AFIP de un buffer PDF
async function extractAfipNumber(pdfBuffer: Buffer): Promise<string | null> {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(pdfBuffer);
    const text = data.text;
    // Buscar patrón tipo "Comp. Nro: 0000X-0000XXXX" o "Punto de Venta: 0000X Comp. Nro: 0000XXXX"
    // Facturas AFIP generalmente dicen "Comp. Nro: 00003-00000123"
    const match = text.match(/Comp\.\s*Nro:\s*(\d{4,5}-\d{8})/i);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error("Error parseando PDF:", error);
    return null;
  }
}

export async function GET() {
  try {
    // Traer todos los comprobantes recientes para mostrar en la tabla (ej. últimos 100)
    const comprobantes = await prisma.accountTransaction.findMany({
      where: {
        type: 'CHARGE'
      },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return NextResponse.json(comprobantes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener comprobantes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, date, dueDate, concept, amount, comprobanteType, billingProfile, fileBase64, manualReceiptNumber } = body;

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

    let finalReceiptNumber = manualReceiptNumber || null;

    if (billingProfile === 'NO_FISCAL') {
      // Generar numeración automática interna
      const prefijo = comprobanteType === 'NOTA_CREDITO' ? 'NC' : 'FACT';
      // Buscar el último comprobante no fiscal emitido
      const lastTx = await prisma.accountTransaction.findFirst({
        where: {
          billingProfile: 'NO_FISCAL',
          receiptNumber: { startsWith: prefijo }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      let nextNum = 1;
      if (lastTx && lastTx.receiptNumber) {
        const parts = lastTx.receiptNumber.split('-');
        if (parts.length === 2) {
          const lastNum = parseInt(parts[1], 10);
          if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
      }
      finalReceiptNumber = `${prefijo}-${nextNum.toString().padStart(8, '0')}`;
    } else {
      // Perfil fiscal, intentar extraer el número del PDF si no lo escribieron a mano
      if (!finalReceiptNumber && fileBase64) {
        // fileBase64 viene como "data:application/pdf;base64,JVBERi0xLjQK..."
        const base64Data = fileBase64.split(',')[1] || fileBase64;
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const extractedNum = await extractAfipNumber(pdfBuffer);
        if (extractedNum) {
          finalReceiptNumber = extractedNum;
        }
      }
    }

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
        receiptNumber: finalReceiptNumber,
        receiptFileBase64: fileBase64 || null,
        isEmailed: false
      },
      include: { client: { select: { name: true } } }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al emitir comprobante' }, { status: 500 });
  }
}
