import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, pdfBase64 } = data;
    const userEmail = request.headers.get('x-user-email');
    const isJuanma = request.headers.get('x-is-juanma') === 'true';

    if (!id || !pdfBase64) {
      return NextResponse.json({ error: 'Faltan datos para el envío' }, { status: 400 });
    }

    const tx = await prisma.accountTransaction.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!tx || !tx.client) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    if (!tx.client.email) {
      return NextResponse.json({ error: 'El cliente no tiene un email configurado' }, { status: 400 });
    }

    if (!process.env.SMTP_USER) {
      console.warn("SMTP no configurado. Simulado el envío a:", tx.client.email);
      return NextResponse.json({ success: true, simulated: true });
    }

    const base64Data = pdfBase64.split(',')[1] || pdfBase64;
    const buffer = Buffer.from(base64Data, 'base64');
    
    // We send from the generic SMTP_USER, but we can set Reply-To and Sender Name
    const senderName = isJuanma ? "Juan Martin Brigi" : "Federico Milesi";
    const senderEmail = userEmail || process.env.SMTP_USER;
    
    await transporter.sendMail({
      from: `"${senderName}" <${process.env.SMTP_USER}>`,
      replyTo: senderEmail,
      to: tx.client.email,
      subject: `Comprobante de Honorarios - ${senderName}`,
      html: `
        <p>Hola ${tx.client.name},</p>
        <p>Adjuntamos el comprobante de honorarios correspondiente.</p>
        <p>Quedamos a disposición por cualquier consulta.</p>
        <br>
        <p>Saludos cordiales,</p>
        <p><strong>${senderName}</strong><br>Estudio Contable</p>
      `,
      attachments: [
        {
          filename: `Comprobante_${tx.receiptNumber || 'Honorarios'}.pdf`,
          content: buffer,
          contentType: 'application/pdf'
        }
      ]
    });

    // Mark as emailed
    await prisma.accountTransaction.update({
      where: { id: tx.id },
      data: { isEmailed: true }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al enviar email:', error);
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 });
  }
}
