import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { month, salaries } = data; // salaries: { employeeId, amount }[]

    if (!month || !salaries || !Array.isArray(salaries)) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verify month format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Formato de mes inválido (esperado YYYY-MM)' }, { status: 400 });
    }

    const inserted = [];
    for (const s of salaries) {
      if (s.amount > 0) {
        const record = await prisma.salary.upsert({
          where: {
            employeeId_month: {
              employeeId: s.employeeId,
              month
            }
          },
          update: {
            amount: s.amount
          },
          create: {
            employeeId: s.employeeId,
            month,
            amount: s.amount,
            isPaid: false
          }
        });
        inserted.push(record);
      }
    }

    return NextResponse.json({ success: true, count: inserted.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error procesando la liquidación' }, { status: 500 });
  }
}
