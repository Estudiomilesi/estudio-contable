import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(employees);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 });
  }
}
