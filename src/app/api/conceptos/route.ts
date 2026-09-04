import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const conceptos = await prisma.concept.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(conceptos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching conceptos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, type } = await req.json();
    if (!name || !type) return NextResponse.json({ error: 'Name and type required' }, { status: 400 });

    const newConcept = await prisma.concept.create({
      data: { name, type }
    });
    return NextResponse.json(newConcept);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating concept' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, isActive } = await req.json();
    const updated = await prisma.concept.update({
      where: { id },
      data: { name, isActive }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating concept' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.concept.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    // If it's linked (though currently it's just a string copy, but if we change later), we just deactivate.
    return NextResponse.json({ error: 'Cannot delete' }, { status: 500 });
  }
}
