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
