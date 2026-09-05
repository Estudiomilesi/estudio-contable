import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseToUtcNoon } from '@/lib/dateUtils';

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

export async function GET(request: Request) {
  try {
    const isJuanma = request.headers.get('x-is-juanma') === 'true';
    const whereClause: any = {
      OR: [
        { type: 'CHARGE' },
        { type: 'PAYMENT', description: { startsWith: 'NC:' } }
      ]
    };

    if (isJuanma) {
      whereClause.client = {
        professionalLabel: { in: ['FJ', 'JF'] }
      };
    }

    const comprobantes = await prisma.accountTransaction.findMany({
      where: whereClause,
      include: { client: { select: { name: true, professionalLabel: true } } },
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
    const { 
      clientId, date, dueDate, description, amount, netAmount, ivaAmount,
      comprobanteType, billingProfile, receiptFileBase64, manualReceiptNumber, 
      collaboratorName, collaboratorAmount, items 
    } = body;

    if (!clientId || !date || !amount || !comprobanteType || !items || !items.length) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const txDate = parseToUtcNoon(date);
    const txDueDate = dueDate ? parseToUtcNoon(dueDate) : txDate;
    
    let receiptNumber = manualReceiptNumber || null;
    let fileToSave = receiptFileBase64 || null;

    if (billingProfile === 'NO_FISCAL') {
      const prefijo = comprobanteType === 'NOTA_CREDITO' ? 'NC' : 'FACT';
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
      receiptNumber = `${prefijo}-${nextNum.toString().padStart(8, '0')}`;
    } else {
      if (fileToSave && !receiptNumber) {
        const base64Data = fileToSave.split(',')[1] || fileToSave;
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          const extracted = await extractAfipNumber(buffer);
          if (extracted) receiptNumber = extracted;
        }
      }
    }

    const transaction = await prisma.accountTransaction.create({
      data: {
        clientId,
        date: txDate,
        dueDate: txDueDate,
        type: comprobanteType === 'FACTURA' ? 'CHARGE' : 'PAYMENT',
        billingProfile,
        description,
        amount,
        netAmount,
        ivaAmount,
        receiptNumber,
        receiptFileBase64: fileToSave,
        collaboratorName: collaboratorName || null,
        collaboratorAmount: collaboratorAmount ? parseFloat(collaboratorAmount) : null,
        items: {
          create: items.map((i: any) => ({
            concept: i.concept,
            amount: parseFloat(i.amount)
          }))
        }
      }
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 });
  }
}
