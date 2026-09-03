import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      clientId, 
      amount, 
      account, 
      description, 
      date, 
      checkDetails, 
      selectedChargeIds 
    } = data;

    if (!clientId || !amount || !account || !selectedChargeIds || selectedChargeIds.length === 0) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const txAmount = parseFloat(amount);
    if (isNaN(txAmount) || txAmount <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    if (account === 'CHEQUES' && (!checkDetails || !checkDetails.number || !checkDetails.bank || !checkDetails.dueDate)) {
      return NextResponse.json({ error: 'Faltan detalles del cheque' }, { status: 400 });
    }

    const txDate = date ? new Date(date) : new Date();

    // 1. Crear el movimiento en Tesorería
    const treasuryTx = await prisma.treasuryTransaction.create({
      data: {
        date: txDate,
        amount: txAmount,
        type: 'INCOME',
        account: account,
        category: 'Honorarios', // Fijo porque es un cobro de cuenta corriente
        description: description || `Cobro rápido a facturas`,
        clientId: clientId,
      }
    });

    // 1b. Si es cheque, crear el registro en la tabla Check
    if (account === 'CHEQUES' && checkDetails) {
      await prisma.check.create({
        data: {
          number: checkDetails.number,
          bank: checkDetails.bank,
          issueDate: new Date(checkDetails.issueDate || txDate),
          dueDate: new Date(checkDetails.dueDate),
          amount: txAmount,
          clientId: clientId,
          incomingTxId: treasuryTx.id,
          status: 'IN_PORTFOLIO'
        }
      });
    }

    // 2. Crear el Payment en la Cuenta Corriente
    const accountTx = await prisma.accountTransaction.create({
      data: {
        clientId: clientId,
        date: txDate,
        type: 'PAYMENT',
        amount: txAmount,
        description: `Pago ingresado en ${account} - ${description || ''}`,
      }
    });

    // 3. Aplicar el pago a los cargos seleccionados secuencialmente
    // Primero traer los cargos con sus aplicaciones actuales para saber cuánto deben
    const charges = await prisma.accountTransaction.findMany({
      where: {
        id: { in: selectedChargeIds }
      },
      include: {
        paymentsApplied: true
      },
      orderBy: {
        date: 'asc' // Aplicar primero a los más viejos
      }
    });

    let remainingPayment = txAmount;

    for (const charge of charges) {
      if (remainingPayment <= 0.001) break; // Ya se agotó el pago

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

    return NextResponse.json({ success: true, treasuryTxId: treasuryTx.id, accountTxId: accountTx.id }, { status: 201 });
  } catch (error) {
    console.error("Error en cobro rápido:", error);
    return NextResponse.json({ error: 'Error interno al registrar el cobro' }, { status: 500 });
  }
}
