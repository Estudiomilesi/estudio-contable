import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseToUtcNoon } from '@/lib/dateUtils';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { salaryId, date, payments } = data;

    if (!salaryId || !date || !payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos o pagos inválidos' }, { status: 400 });
    }

    const salary = await prisma.salary.findUnique({
      where: { id: salaryId },
      include: { employee: true }
    });

    if (!salary) {
      return NextResponse.json({ error: 'Sueldo no encontrado' }, { status: 404 });
    }

    if (salary.isPaid) {
      return NextResponse.json({ error: 'Este sueldo ya fue pagado' }, { status: 400 });
    }

    const totalPagado = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    if (Math.abs(totalPagado - salary.amount) > 1) {
       // Tolerance of $1 for rounding
       return NextResponse.json({ error: 'El monto total pagado no coincide con el sueldo' }, { status: 400 });
    }

    const txDate = parseToUtcNoon(date);

    for (const payment of payments) {
      const txAmount = -Math.abs(payment.amount);

      const nuevaTransaccion = await prisma.treasuryTransaction.create({
        data: {
          date: txDate,
          amount: txAmount,
          type: 'EXPENSE',
          account: payment.account,
          category: 'Sueldos',
          description: `Sueldo ${salary.employee.name} - ${salary.month}`,
          clientId: null,
          salaryId: salary.id,
        }
      });

      if (payment.account === 'CHEQUES' && payment.checkIds && payment.checkIds.length > 0) {
        for (const checkId of payment.checkIds) {
          await prisma.check.update({
            where: { id: checkId },
            data: {
              status: 'DELIVERED',
              outgoingTxId: nuevaTransaccion.id
            }
          });
        }
      }
    }

    // Update Salary
    await prisma.salary.update({
      where: { id: salary.id },
      data: {
        isPaid: true,
        paidAt: txDate,
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error procesando el pago' }, { status: 500 });
  }
}
