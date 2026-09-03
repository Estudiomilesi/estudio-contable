import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recalculatePaymentIva } from '@/lib/iva';

export async function GET() {
  try {
    const transacciones = await prisma.treasuryTransaction.findMany({
      include: { client: true },
      orderBy: { date: 'desc' },
      take: 100, // Traer las últimas 100
    });

    const allTxs = await prisma.treasuryTransaction.findMany();
    const saldos: Record<string, number> = { 
      'CAJA': 0, 
      'CAJA IVA': 0, 
      'BANCOS FEDE': 0, 
      'BANCOS JUANMA': 0, 
      'CHEQUES': 0 
    };
    
    allTxs.forEach(t => {
      if (saldos[t.account] === undefined) saldos[t.account] = 0;
      saldos[t.account] += t.amount;
    });

    const checksEnCartera = await prisma.check.findMany({
      where: { status: 'IN_PORTFOLIO' },
      include: { client: true },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json({
      transacciones,
      saldos,
      cartera: checksEnCartera
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener datos de tesorería' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    let txAmount = parseFloat(data.amount || '0');
    
    // Si es un egreso de cheques, sumamos los cheques seleccionados
    if (data.account === 'CHEQUES' && data.type !== 'INCOME') {
      if (!data.selectedCheckIds || data.selectedCheckIds.length === 0) {
        return NextResponse.json({ error: 'Debe seleccionar al menos un cheque' }, { status: 400 });
      }
      
      const checksToPay = await prisma.check.findMany({
        where: { id: { in: data.selectedCheckIds }, status: 'IN_PORTFOLIO' }
      });
      
      if (checksToPay.length !== data.selectedCheckIds.length) {
        return NextResponse.json({ error: 'Algunos cheques ya no están en cartera' }, { status: 400 });
      }

      const totalChecks = checksToPay.reduce((sum, c) => sum + c.amount, 0);
      txAmount = -totalChecks; // Egresos son negativos en nuestra lógica de TreasuryTransaction
    }

    const nuevaTransaccion = await prisma.treasuryTransaction.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        amount: txAmount,
        type: data.type, // INCOME | EXPENSE
        account: data.account, // CAJA | BANCOS | CHEQUES
        category: data.category, // Honorarios, Gastos, Retiro Fede, etc
        description: data.description || null,
        clientId: data.clientId || null,
      }
    });

    // Handle INCOMING Checks
    if (data.account === 'CHEQUES' && data.type === 'INCOME') {
      if (!data.checkDetails || !data.checkDetails.number) {
        return NextResponse.json({ error: 'Debe proveer detalles del cheque' }, { status: 400 });
      }
      
      await prisma.check.create({
        data: {
          number: data.checkDetails.number,
          bank: data.checkDetails.bank,
          issueDate: new Date(data.checkDetails.issueDate || data.date),
          dueDate: new Date(data.checkDetails.dueDate),
          amount: Math.abs(txAmount),
          clientId: data.clientId || null,
          incomingTxId: nuevaTransaccion.id
        }
      });
    }

    // Handle OUTGOING Checks
    if (data.account === 'CHEQUES' && data.type !== 'INCOME') {
      await prisma.check.updateMany({
        where: { id: { in: data.selectedCheckIds } },
        data: { status: 'DELIVERED', outgoingTxId: nuevaTransaccion.id }
      });
    }

    // Si es un ingreso por "Honorarios" y tiene un clientId asociado, registrar el pago en cuenta corriente
    if (data.type === 'INCOME' && data.category === 'Honorarios' && data.clientId) {
      const accountTx = await prisma.accountTransaction.create({
        data: {
          clientId: data.clientId,
          date: data.date ? new Date(data.date) : new Date(),
          type: 'PAYMENT',
          amount: Math.abs(txAmount),
          description: `Pago ingresado en ${data.account} - ${data.description || ''}`,
        }
      });

      // Si nos pasaron cargos seleccionados desde Tesorería, aplicar el pago a esos cargos
      if (data.selectedChargeIds && Array.isArray(data.selectedChargeIds) && data.selectedChargeIds.length > 0) {
        const charges = await prisma.accountTransaction.findMany({
          where: { id: { in: data.selectedChargeIds } },
          include: { paymentsApplied: true },
          orderBy: { date: 'asc' }
        });

        let remainingPayment = Math.abs(txAmount);

        for (const charge of charges) {
          if (remainingPayment <= 0.001) break;

          const appliedToCharge = charge.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
          const chargeDebt = charge.amount - appliedToCharge;

          if (chargeDebt > 0.001) {
            const amountToApply = Math.min(remainingPayment, chargeDebt);
            await prisma.paymentApplication.create({
              data: {
                chargeId: charge.id,
                paymentId: accountTx.id,
                amount: amountToApply
              }
            });
            remainingPayment -= amountToApply;
          }
        }
        
        await recalculatePaymentIva(accountTx.id);
      }
    }

    return NextResponse.json(nuevaTransaccion, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 });
  }
}
