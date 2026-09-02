import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const description = data.description || 'Abono Mensual';
    const billingDate = data.billingDate ? new Date(data.billingDate) : new Date();
    const clientIds = data.clientIds || [];
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesActual = meses[billingDate.getMonth()];
    const anoActual = billingDate.getFullYear();
    const periodoStr = `${mesActual} ${anoActual}`;

    // Obtener los clientes (todos los activos, o solo los seleccionados)
    const clientes = await prisma.client.findMany({
      where: { 
        isActive: true,
        currentFee: { gt: 0 },
        ...(clientIds.length > 0 ? { id: { in: clientIds } } : {})
      }
    });

    let emailsEnviados = 0;
    const transacciones = [];

    for (const cliente of clientes) {
      const transaccion = await prisma.accountTransaction.create({
        data: {
          clientId: cliente.id,
          date: billingDate,
          type: 'CHARGE',
          amount: cliente.currentFee,
          description: `${description} - ${periodoStr}`
        }
      });
      transacciones.push(transaccion);

      // Enviar email si tiene un email válido (asumimos que tienen email)
      if (cliente.email && cliente.email !== 'falta@email.com') {
        const correosDestino = cliente.email.split(',').map(e => e.trim()).join(', ');
        
        const htmlEmail = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #333;">Comprobante de Abono Mensual</h2>
            <p>Estimado/a <strong>${cliente.name}</strong>,</p>
            <p>Le enviamos el detalle del abono correspondiente al mes en curso.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Período:</strong> ${periodoStr}</p>
              <p style="margin: 0 0 10px 0;"><strong>Concepto:</strong> Honorarios Contables - Abono Mensual</p>
              <p style="margin: 0; font-size: 18px;"><strong>Importe a abonar:</strong> $${cliente.currentFee.toLocaleString('es-AR')}</p>
            </div>
            
            <p>Por favor, recuerde enviar el comprobante de transferencia o pago una vez realizado.</p>
            <p>Ante cualquier duda, estamos a su disposición.</p>
            
            <br/>
            <p style="color: #666; font-size: 14px;">Atentamente,<br/><strong>Estudio Milesi</strong></p>
          </div>
        `;

        try {
          await sendEmail(
            correosDestino, 
            `Abono Mensual Estudio Milesi - ${periodoStr} - ${cliente.name}`, 
            htmlEmail
          );
          emailsEnviados++;
        } catch (mailErr) {
          console.error(`Error enviando email a ${cliente.email}:`, mailErr);
        }
      }
    }

    return NextResponse.json({ 
      message: `Se facturó a ${transacciones.length} clientes y se enviaron ${emailsEnviados} correos electrónicos automáticamente.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error al procesar facturación masiva y enviar correos' }, { status: 500 });
  }
}
