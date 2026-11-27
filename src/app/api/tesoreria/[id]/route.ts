import { checkClosedMonth } from '@/lib/monthLock';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Only allow updating category, description, and employeeId for safety.
    const existingTx = await prisma.treasuryTransaction.findUnique({ where: { id } });
    if (existingTx) {
      const lockCheck = await checkClosedMonth(existingTx.date);
      if (lockCheck.isClosed) {
        return NextResponse.json({ error: lockCheck.errorMsg }, { status: 400 });
      }
    }

    const { category, description, employeeId } = data;

    const tx = await prisma.treasuryTransaction.update({
      where: { id },
      data: {
        category,
        description,
        employeeId: employeeId !== undefined ? employeeId : undefined
      }
    });

    return NextResponse.json(tx);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating transaction' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const tx = await prisma.treasuryTransaction.findUnique({
      where: { id },
      include: {
        incomingChecks: true,
        outgoingChecks: true,
        salaries: true
      }
    });

    if (!tx) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
    }
    const lockCheck = await checkClosedMonth(tx.date);
    if (lockCheck.isClosed) {
      return NextResponse.json({ error: lockCheck.errorMsg }, { status: 400 });
    }

    // Si tiene cheques entrantes, borrarlos
    if (tx.incomingChecks.length > 0) {
      await prisma.check.deleteMany({
        where: { incomingTxId: id }
      });
    }

    // Si tiene cheques salientes, devolverlos a cartera
    if (tx.outgoingChecks.length > 0) {
      await prisma.check.updateMany({
        where: { outgoingTxId: id },
        data: {
          status: 'IN_PORTFOLIO',
          outgoingTxId: null
        }
      });
    }

    // Si tiene accountTransaction asociada (o en sus transacciones hijas por cobro compartido), borrarlas también
    const childTxs = await prisma.treasuryTransaction.findMany({
      where: { parentTransactionId: id },
      select: { accountTransactionId: true }
    });
    const accountTxIds = [
      tx.accountTransactionId,
      ...childTxs.map(c => c.accountTransactionId)
    ].filter((aid): aid is string => Boolean(aid));

    if (accountTxIds.length > 0) {
      await prisma.paymentApplication.deleteMany({
        where: {
          OR: [
            { paymentId: { in: accountTxIds } },
            { chargeId: { in: accountTxIds } }
          ]
        }
      });

      await prisma.accountTransactionItem.deleteMany({
        where: { transactionId: { in: accountTxIds } }
      });
      
      await prisma.accountTransaction.deleteMany({
        where: { id: { in: accountTxIds } }
      });
    }

    // Si fue un pago de sueldos (tiene salaries conectados), marcarlos como no pagados si se borra el pago
    if (tx.salaries && tx.salaries.length > 0) {
      const salaryIds = tx.salaries.map((s: any) => s.id);
      await prisma.salary.updateMany({
        where: { id: { in: salaryIds } },
        data: {
          isPaid: false,
          paidAt: null
        }
      });
    }

    // Borrar transacciones hijas vinculadas (ej. retiros automáticos) y la transacción principal
    await prisma.treasuryTransaction.deleteMany({
      where: {
        OR: [
          { parentTransactionId: id },
          { id }
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error eliminando transacción' }, { status: 500 });
  }
}
