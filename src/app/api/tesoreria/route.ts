import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transacciones = await prisma.treasuryTransaction.findMany({
      orderBy: { date: 'desc' },
      take: 100, // Traer las últimas 100
    });

    // Obtener saldos de las cuentas sumando los montos (ingresos positivos, egresos negativos)
    // Para simplificar, lo calcularemos en memoria para devolver los totales
    const allTxs = await prisma.treasuryTransaction.findMany();
    const saldos = { CAJA: 0, BANCOS: 0, CHEQUES: 0 };
    
    allTxs.forEach(t => {
      saldos[t.account] += t.amount;
    });

    return NextResponse.json({
      transacciones,
      saldos
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener datos de tesorería' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const nuevaTransaccion = await prisma.treasuryTransaction.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        amount: parseFloat(data.amount),
        type: data.type, // INCOME | EXPENSE
        account: data.account, // CAJA | BANCOS | CHEQUES
        category: data.category, // Honorarios, Gastos, Retiro Fede, etc
        description: data.description || null,
        referenceId: data.referenceId || null,
      }
    });

    // Si es un ingreso por "Honorarios" y tiene un clientId asociado, deberíamos registrar el pago en la cuenta corriente del cliente
    if (data.type === 'INCOME' && data.category === 'Honorarios' && data.clientId) {
      await prisma.accountTransaction.create({
        data: {
          clientId: data.clientId,
          date: data.date ? new Date(data.date) : new Date(),
          type: 'PAYMENT',
          amount: parseFloat(data.amount),
          description: `Pago ingresado en ${data.account} - ${data.description || ''}`,
          treasuryTransactionId: nuevaTransaccion.id
        }
      });
    }

    return NextResponse.json(nuevaTransaccion, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 });
  }
}
