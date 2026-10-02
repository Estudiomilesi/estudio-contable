import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseToUtcNoon } from '@/lib/dateUtils';
import { recalculatePaymentIva } from '@/lib/iva';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      clientId, 
      date, 
      selectedChargeIds,
      // Legacy single payment
      amount, 
      account, 
      description, 
      checkDetails, 
      // New multiple payments
      payments: rawPayments
    } = data;

    if (!clientId || !selectedChargeIds || selectedChargeIds.length === 0) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Normalize to an array of payments
    let payments = [];
    if (rawPayments && Array.isArray(rawPayments) && rawPayments.length > 0) {
      payments = rawPayments;
    } else if (amount && account) {
      payments = [{ amount, account, description, checkDetails }];
    } else {
      return NextResponse.json({ error: 'Faltan datos del pago' }, { status: 400 });
    }

    const txDate = parseToUtcNoon(date);

    // Validate payments
    for (const p of payments) {
      const pAmount = parseFloat(p.amount);
      if (isNaN(pAmount) || pAmount <= 0) {
        return NextResponse.json({ error: 'Monto inválido en los pagos' }, { status: 400 });
      }
      if (p.account === 'CHEQUES' && (!p.checkDetails || !p.checkDetails.number || !p.checkDetails.bank || !p.checkDetails.dueDate)) {
        return NextResponse.json({ error: 'Faltan detalles del cheque en uno de los pagos' }, { status: 400 });
      }
      p.parsedAmount = pAmount;
    }

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

    const results = [];

    // Process each payment sequentially
    for (const payment of payments) {
      const txAmount = payment.parsedAmount;

      // 1. Crear el movimiento en Tesorería
      const treasuryTx = await prisma.treasuryTransaction.create({
        data: {
          date: txDate,
          amount: txAmount,
          type: 'INCOME',
          account: payment.account,
          category: 'Honorarios', // Fijo porque es un cobro de cuenta corriente
          description: payment.description || `Cobro a facturas`,
          clientId: clientId,
        }
      });

      // 1b. Si es cheque, crear el registro en la tabla Check
      if (payment.account === 'CHEQUES' && payment.checkDetails) {
        await prisma.check.create({
          data: {
            number: payment.checkDetails.number,
            bank: payment.checkDetails.bank,
            issueDate: new Date(payment.checkDetails.issueDate || txDate),
            dueDate: new Date(payment.checkDetails.dueDate),
            amount: txAmount,
            clientId: clientId,
            incomingTxId: treasuryTx.id,
            isEcheq: payment.checkDetails.isEcheq === true,
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
          description: `Pago ingresado en ${payment.account} - ${payment.description || ''}`,
        }
      });

      // 2.5 Vincular el cobro a la caja
      await prisma.treasuryTransaction.update({
        where: { id: treasuryTx.id },
        data: { accountTransactionId: accountTx.id }
      });

      let remainingPayment = txAmount;
      const createdApplications = [];

      for (const charge of charges) {
        if (remainingPayment <= 0.001) break; // Ya se agotó este pago

        const appliedToCharge = charge.paymentsApplied.reduce((sum, app) => sum + app.amount, 0) + ((charge as any).newlyApplied || 0);
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
          
          createdApplications.push({ amount: amountToApply, charge });
          remainingPayment -= amountToApply;
          (charge as any).newlyApplied = ((charge as any).newlyApplied || 0) + amountToApply;
        }
      }

      // Recalcular IVA del pago en base a lo que cubrió
      await recalculatePaymentIva(accountTx.id);

      // Obtener el pago actualizado con el neto calculado (sin IVA)
      const updatedAccountTx = await prisma.accountTransaction.findUnique({
        where: { id: accountTx.id }
      });
      const pagoNeto = updatedAccountTx?.netAmount || txAmount;

      // 5. Automatización: Retiros automáticos en Bancos (neteando participaciones pagadas)
      if (payment.account === 'BANCOS FEDE' || payment.account === 'BANCOS JUANMA') {
        const retiroSocio = payment.account === 'BANCOS FEDE' ? 'Retiro Fede' : 'Retiro Juanma';
        
        let participacionPaga = 0;
        for (const app of createdApplications) {
          if (app.charge.collaboratorAmount && app.charge.collaboratorAmount > 0) {
            // Proporción de la participación basada en cuánto se pagó del cargo original
            const proportion = app.amount / app.charge.amount;
            participacionPaga += app.charge.collaboratorAmount * proportion;
          }
        }
        
        const retiroNetoAmount = Math.max(0, pagoNeto - participacionPaga);
        const ivaAmount = txAmount - pagoNeto;

        if (retiroNetoAmount > 0) {
          await prisma.treasuryTransaction.create({
            data: {
              date: txDate,
              amount: -retiroNetoAmount,
              type: 'EXPENSE',
              account: payment.account,
              category: retiroSocio,
              description: `Retiro automático s/ cobro ${payment.description || ''}`,
              clientId: clientId
            }
          });
        }

        if (ivaAmount > 0) {
          await prisma.treasuryTransaction.create({
            data: {
              date: txDate,
              amount: -ivaAmount,
              type: 'EXPENSE',
              account: payment.account,
              category: retiroSocio,
              description: `Retiro automático IVA s/ cobro ${payment.description || ''}`,
              clientId: clientId
            }
          });
        }
      }

      results.push({ treasuryTxId: treasuryTx.id, accountTxId: accountTx.id });
    }

    return NextResponse.json({ success: true, results }, { status: 201 });
  } catch (error) {
    console.error("Error en cobro rápido:", error);
    return NextResponse.json({ error: 'Error interno al registrar el cobro: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
