import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const notes = await prisma.clientNote.findMany({
      where: { clientId: resolvedParams.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching notes' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { content } = await request.json();
    const resolvedParams = await params;
    const createdBy = request.headers.get('x-user-email') || 'Usuario Desconocido';
    
    const note = await prisma.clientNote.create({
      data: {
        clientId: resolvedParams.id,
        content,
        createdBy
      }
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating note' }, { status: 500 });
  }
}
