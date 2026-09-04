import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseToUtcNoon } from '@/lib/dateUtils';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { salaryIds, date, payments } = data;

    if (!salaryIds || !Array.isArray(salaryIds) || salaryIds.length === 0 || !date || !payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos o pagos inválidos' }, { status: 400 });
    }

    const salariesToPay = await prisma.salary.findMany({
      where: { id: { in: salaryIds } },
      include: { employee: true }
    });

    if (salariesToPay.length !== salaryIds.length) {
      return NextResponse.json({ error: 'Algunos sueldos no fueron encontrados' }, { status: 404 });
    }

    if (salariesToPay.some(s => s.isPaid)) {
      return NextResponse.json({ error: 'Uno o más sueldos ya fueron pagados' }, { status: 400 });
    }

    const totalToPay = salariesToPay.reduce((acc, s) => acc + s.amount, 0);
    const totalPagado = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    
    if (Math.abs(totalPagado - totalToPay) > 1) {
       // Tolerance of $1 for rounding
       return NextResponse.json({ error: 'El monto total pagado no coincide con el total de los sueldos seleccionados' }, { status: 400 });
    }

    const txDate = parseToUtcNoon(date);

    for (const payment of payments) {
      const txAmount = -Math.abs(payment.amount);

      let desc = 'Pago de Sueldos Varios';
      if (salariesToPay.length === 1) {
        desc = `Sueldo ${salariesToPay[0].employee.name} - ${salariesToPay[0].month}`;
      } else {
        const names = Array.from(new Set(salariesToPay.map(s => s.employee.name))).join(', ');
        desc = `Sueldos Varios (${names})`;
      }

      const nuevaTransaccion = await prisma.treasuryTransaction.create({
        data: {
          date: txDate,
          amount: txAmount,
          type: 'EXPENSE',
          account: payment.account,
          category: 'Sueldos',
          description: desc,
          clientId: null,
          salaries: {
            connect: salariesToPay.map(s => ({ id: s.id }))
          }
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

    // Update Salaries
    await prisma.salary.updateMany({
      where: { id: { in: salaryIds } },
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
