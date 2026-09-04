import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseToUtcNoon } from '@/lib/dateUtils';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { salaryId, account, date, checkDetails } = data;

    if (!salaryId || !account || !date) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const salary = await prisma.salary.findUnique({
      where: { id: salaryId },
      include: { employee: true }
    });

    if (!salary) {
      return NextResponse.json({ error: 'Sueldo no encontrado' }, { status: 404 });
    }

    if (salary.isPaid && salary.treasuryTxId) {
      return NextResponse.json({ error: 'Este sueldo ya fue pagado' }, { status: 400 });
    }

    // Calcular el transaction amount
    let txAmount = -salary.amount;
    
    // Si paga con cheques, crear cheques salientes... wait!
    // Para simplificar, asumiremos que los sueldos rara vez se pagan transfiriendo cheques de terceros.
    // Si se paga con CHEQUES, necesitamos vincular los IDs.
    // Dejaremos la misma lgica que en Tesorera si es necesario, pero simplifiquemos para que slo usen Caja o Bancos.
    if (account === 'CHEQUES' && (!checkDetails || checkDetails.length === 0)) {
      return NextResponse.json({ error: 'Debe seleccionar cheques para el pago' }, { status: 400 });
    }

    const txDate = parseToUtcNoon(date);

    // Create the treasury transaction
    const nuevaTransaccion = await prisma.treasuryTransaction.create({
      data: {
        date: txDate,
        amount: txAmount,
        type: 'EXPENSE',
        account: account,
        category: 'Sueldos',
        description: `Sueldo ${salary.employee.name} - ${salary.month}`,
        clientId: null,
      }
    });

    if (account === 'CHEQUES') {
      // Mark selected checks as delivered and link them
      for (const checkId of checkDetails) {
        await prisma.check.update({
          where: { id: checkId },
          data: {
            status: 'DELIVERED',
            outgoingTxId: nuevaTransaccion.id
          }
        });
      }
    }

    // Update Salary
    await prisma.salary.update({
      where: { id: salary.id },
      data: {
        isPaid: true,
        paidAt: txDate,
        treasuryTxId: nuevaTransaccion.id
      }
    });

    return NextResponse.json({ success: true, transactionId: nuevaTransaccion.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error procesando el pago' }, { status: 500 });
  }
}
