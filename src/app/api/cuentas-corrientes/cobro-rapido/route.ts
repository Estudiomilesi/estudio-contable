import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseToUtcNoon } from '@/lib/dateUtils';
import { recalculatePaymentIva } from '@/lib/iva';

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

    const parseDate = (dString: string) => {
      if (!dString) return new Date();
      if (dString.includes('T')) return new Date(dString);
      return new Date(`${dString}T12:00:00`);
    };

    const txDate = parseToUtcNoon(date);

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

    const createdApplications = [];
    for (const charge of charges) {
      if (remainingPayment <= 0.001) break; // Ya se agotó el pago

      const appliedToCharge = charge.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
      const chargeDebt = charge.amount - appliedToCharge;

      if (chargeDebt > 0.001) {
        const amountToApply = Math.min(remainingPayment, chargeDebt);
        
        const newApp = await prisma.paymentApplication.create({
          data: {
            chargeId: charge.id,
            paymentId: accountTx.id,
            amount: amountToApply
          }
        });
        createdApplications.push({ amount: amountToApply, charge });
        remainingPayment -= amountToApply;
      }
    }

    // Recalcular IVA del pago en base a lo que cubrió
    await recalculatePaymentIva(accountTx.id);

    // 5. Automatización: Retiros automáticos en Bancos (neteando participaciones pagadas)
    if (account === 'BANCOS FEDE' || account === 'BANCOS JUANMA') {
      const retiroSocio = account === 'BANCOS FEDE' ? 'Retiro Fede' : 'Retiro Juanma';
      
      let participacionPaga = 0;
      for (const app of createdApplications) {
        if (app.charge.collaboratorAmount && app.charge.collaboratorAmount > 0) {
          // Proporción de la participación basada en cuánto se pagó del cargo original
          const proportion = app.amount / app.charge.amount;
          participacionPaga += app.charge.collaboratorAmount * proportion;
        }
      }
      
      const retiroAmount = Math.max(0, txAmount - participacionPaga);
      if (retiroAmount > 0) {
        await prisma.treasuryTransaction.create({
          data: {
            date: txDate,
            amount: -retiroAmount,
            type: 'EXPENSE',
            account: account,
            category: retiroSocio,
            description: `Retiro automático s/ cobro ${description || ''}`,
            clientId: clientId
          }
        });
      }
    }

    return NextResponse.json({ success: true, treasuryTxId: treasuryTx.id, accountTxId: accountTx.id }, { status: 201 });
  } catch (error) {
    console.error("Error en cobro rápido:", error);
    return NextResponse.json({ error: 'Error interno al registrar el cobro' }, { status: 500 });
  }
}
