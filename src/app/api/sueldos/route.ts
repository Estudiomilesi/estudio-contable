import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const salaries = await prisma.salary.findMany({
      include: {
        employee: true,
      },
      orderBy: [
        { month: 'desc' },
        { employee: { name: 'asc' } }
      ]
    });
    return NextResponse.json(salaries);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching salaries' }, { status: 500 });
  }
}
