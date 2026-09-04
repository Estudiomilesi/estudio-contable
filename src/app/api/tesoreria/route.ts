import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseToUtcNoon } from '@/lib/dateUtils';
import { recalculatePaymentIva } from '@/lib/iva';

export async function GET() {
  try {
    const allTxs = await prisma.treasuryTransaction.findMany({
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' }
      ],
      include: { client: true }
    });

    const saldos: Record<string, number> = { 
      'CAJA': 0, 
      'CAJA IVA': 0, 
      'BANCOS FEDE': 0, 
      'BANCOS JUANMA': 0, 
      'CHEQUES': 0 
    };
    
    const txsWithBalance = allTxs.map(t => {
      if (saldos[t.account] === undefined) saldos[t.account] = 0;
      saldos[t.account] += t.amount;
      return {
        ...t,
        runningBalance: saldos[t.account]
      };
    });

    // Transacciones recientes (últimas 100)
    const transacciones = txsWithBalance.reverse().slice(0, 100);

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

    // Si es un ingreso de cheques, sumamos los cheques entrantes
    if (data.account === 'CHEQUES' && data.type === 'INCOME') {
      if (!data.incomingChecks || !Array.isArray(data.incomingChecks) || data.incomingChecks.length === 0) {
        return NextResponse.json({ error: 'Debe ingresar al menos un cheque' }, { status: 400 });
      }
      
      const totalChecks = data.incomingChecks.reduce((sum: number, c: any) => sum + (parseFloat(c.amount) || 0), 0);
      if (totalChecks <= 0) {
        return NextResponse.json({ error: 'El monto de los cheques debe ser mayor a 0' }, { status: 400 });
      }
      txAmount = Math.abs(totalChecks);
    }

    // Evitar desfase de zona horaria usando T12:00:00
    const parseDate = (dString: string) => {
      if (!dString) return new Date();
      if (dString.includes('T')) return new Date(dString);
      return new Date(`${dString}T12:00:00`);
    };

    const nuevaTransaccion = await prisma.treasuryTransaction.create({
      data: {
        date: parseToUtcNoon(data.date),
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
      for (const checkData of data.incomingChecks) {
        if (!checkData.number || !checkData.bank || !checkData.amount) continue;
        
        await prisma.check.create({
          data: {
            number: checkData.number,
            bank: checkData.bank,
            issueDate: parseToUtcNoon(checkData.issueDate || data.date),
            dueDate: parseToUtcNoon(checkData.dueDate),
            amount: Math.abs(parseFloat(checkData.amount)),
            clientId: data.clientId || null,
            incomingTxId: nuevaTransaccion.id
          }
        });
      }
    }

    // Handle OUTGOING Checks
    if (data.account === 'CHEQUES' && data.type !== 'INCOME') {
      await prisma.check.updateMany({
        where: { id: { in: data.selectedCheckIds } },
        data: { status: 'DELIVERED', outgoingTxId: nuevaTransaccion.id }
      });
    }

    let participacionPagaEnTesoreria = 0;
    // Si es un ingreso por "Honorarios" y tiene un clientId asociado, registrar el pago en cuenta corriente
    if (data.type === 'INCOME' && data.category === 'Honorarios' && data.clientId) {
      const accountTx = await prisma.accountTransaction.create({
        data: {
          clientId: data.clientId,
          date: parseToUtcNoon(data.date),
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

        const createdApplications = [];
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
            createdApplications.push({ amount: amountToApply, charge });
            remainingPayment -= amountToApply;
          }
        }
        
        await recalculatePaymentIva(accountTx.id);

        // Calculate participacion paid to net the withdrawal
        for (const app of createdApplications) {
          if (app.charge.collaboratorAmount && app.charge.collaboratorAmount > 0) {
            const proportion = app.amount / app.charge.amount;
            participacionPagaEnTesoreria += app.charge.collaboratorAmount * proportion;
          }
        }
      }
    }

    // 5. Automatización: Retiros y Reintegros automáticos en Bancos
    if (data.account === 'BANCOS FEDE' || data.account === 'BANCOS JUANMA') {
      const retiroSocio = data.account === 'BANCOS FEDE' ? 'Retiro Fede' : 'Retiro Juanma';

      if (data.type === 'INCOME') {
        const retiroAmount = Math.max(0, Math.abs(txAmount) - participacionPagaEnTesoreria);
        if (retiroAmount > 0) {
          await prisma.treasuryTransaction.create({
            data: {
              date: parseToUtcNoon(data.date),
              amount: -retiroAmount,
              type: 'EXPENSE',
              account: data.account,
              category: retiroSocio,
              description: `Retiro automático s/ cobro ${data.description || ''}`,
              clientId: data.clientId || null
            }
          });
        }
      } else if (data.type === 'EXPENSE') {
        // Si el banco pagó un gasto que no es un retiro (ej. Alquiler), registrar un Reintegro de Retiro para llevar la caja a 0
        if (data.category !== 'Retiro Fede' && data.category !== 'Retiro Juanma' && data.category !== 'Participacion') {
          await prisma.treasuryTransaction.create({
            data: {
              date: parseToUtcNoon(data.date),
              amount: Math.abs(txAmount),
              type: 'INCOME',
              account: data.account,
              category: retiroSocio,
              description: `Reintegro automático por pago de gasto ${data.description || ''}`,
              clientId: data.clientId || null
            }
          });
        }
      }
    }

    return NextResponse.json(nuevaTransaccion, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 });
  }
}
