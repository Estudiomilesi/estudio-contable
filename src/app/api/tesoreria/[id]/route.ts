import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Only allow updating category, description, and employeeId for safety.
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

    // Si tiene accountTransaction asociada (pago de honorarios), borrarla también para mantener integridad
    if (tx.accountTransactionId) {
      // Como AccountTransaction puede tener items, los borramos primero
      await prisma.accountTransactionItem.deleteMany({
        where: { transactionId: tx.accountTransactionId }
      });
      
      await prisma.accountTransaction.delete({
        where: { id: tx.accountTransactionId }
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

    // Finalmente borrar la transacción de tesorería
    await prisma.treasuryTransaction.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error eliminando transacción' }, { status: 500 });
  }
}
