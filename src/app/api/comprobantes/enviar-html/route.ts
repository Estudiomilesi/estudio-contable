import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: Request) {
  const senderEmail = request.headers.get('x-user-email') || undefined;
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del comprobante' }, { status: 400 });
    }

    const tx = await prisma.accountTransaction.findUnique({
      where: { id },
      include: { 
        client: {
          include: { defaultBankAccount: true }
        },
        paymentCondition: true
      }
    });

    if (!tx || !tx.client) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    if (!tx.client.email || tx.client.email === 'falta@email.com') {
      return NextResponse.json({ error: 'El cliente no tiene un email configurado' }, { status: 400 });
    }

    // Preparar variables para el template
    const cliente = tx.client;
    const correosDestino = cliente.email.split(',').map(e => e.trim()).join(', ');
    const firma = process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' 
      ? 'Estudio Jurídico Cicconi' 
      : (cliente.professionalLabel === 'F' ? 'Estudio Milesi' : 'Estudio Contable F&J');
    const colorPrincipal = '#7C4751'; 
    const colorFondoEtiqueta = '#F5ECE7';
    const colorTextoEtiqueta = '#55434F';
    const logoUrl = 'https://raw.githubusercontent.com/Estudiomilesi/estudio-contable/main/public/logo-dark.png';

        let periodoStr = '';
    let conceptoStr = tx.description || 'Comprobante';
    const matchPeriodo = (tx.description || '').match(/\s*-\s*([A-Za-z]+ \d{4})$/);
    if (matchPeriodo) {
      periodoStr = matchPeriodo[1];
      conceptoStr = (tx.description || '').replace(matchPeriodo[0], '').trim();
    } else {
      const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      periodoStr = `${meses[tx.date.getMonth()]} ${tx.date.getFullYear()}`;
    }
    
    const isNC = tx.type === 'PAYMENT';
    const titulo = isNC ? 'Aviso de Nota de Crédito' : 'Aviso de Honorarios';
    const textoPeriodo = isNC 
      ? `Te enviamos el detalle de la nota de crédito correspondiente al período` 
      : `Te enviamos el detalle de los honorarios correspondientes al período`;
    const labelTotal = isNC ? 'Total a favor' : 'Total a pagar';
    
    // Generar el HTML (mismo template que procesar)
    const htmlEmail = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <div style="padding: 30px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
            <tr>
              <td align="left" valign="middle">
                <h2 style="color: #1e293b; margin: 0; font-size: 22px; border-bottom: 3px solid ${colorPrincipal}; padding-bottom: 5px; display: inline-block;">${titulo}</h2>
              </td>
              <td align="right" valign="middle">
                <img src="${logoUrl}" alt="${firma}" style="max-height: 65px; opacity: 0.9;" />
              </td>
            </tr>
          </table>

          <p style="color: #334155; font-size: 16px;">Hola <strong>${cliente.name}</strong>,</p>
          <p style="color: #334155; font-size: 16px;">Esperamos que te encuentres muy bien.</p>
          <p style="color: #334155; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">${textoPeriodo} <span style="background-color: ${colorFondoEtiqueta}; color: ${colorTextoEtiqueta}; padding: 4px 12px; border-radius: 16px; font-weight: bold; font-size: 15px; display: inline-block; border: 1px solid ${colorPrincipal}; margin-top: 4px; white-space: nowrap;">${periodoStr}</span>.</p>
          
          <!-- Recuadro llamativo del importe -->
          <div style="background-color: #f8fafc; border-left: 5px solid ${colorPrincipal}; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px; line-height: 1.6;"><strong>Comprobante interno:</strong> <span style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #475569; white-space: nowrap;">${tx.receiptNumber || 'N/A'}</span></p>
            <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.8;">
              <strong>Concepto:</strong> 
              <span style="background-color: ${colorFondoEtiqueta}; color: ${colorTextoEtiqueta}; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block; margin-top: 4px;">${conceptoStr}</span>
            </p>
            <p style="margin: 0; font-size: 24px; color: ${colorPrincipal};"><strong>${labelTotal}: $${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></p>
          </div>
          
          ${!isNC ? `
            <!-- Datos bancarios -->
            ${cliente.defaultBankAccount ? `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 16px;">🏛️ Datos para transferencia</h3>
              <p style="margin: 0 0 6px 0; color: #15803d; font-size: 15px;"><strong>Banco:</strong> ${cliente.defaultBankAccount.name}</p>
              ${cliente.defaultBankAccount.cbu ? `<p style="margin: 0 0 6px 0; color: #15803d; font-size: 15px;"><strong>CBU/CVU:</strong> ${cliente.defaultBankAccount.cbu}</p>` : ''}
              ${cliente.defaultBankAccount.alias ? `<p style="margin: 0; color: #15803d; font-size: 15px;"><strong>Alias:</strong> ${cliente.defaultBankAccount.alias}</p>` : ''}
            </div>
            ` : ''}

            ${(tx as any).paymentCondition ? `
            <p style="color: #334155; font-size: 15px; line-height: 1.5;"><strong>Condición de pago:</strong> ${(tx as any).paymentCondition.name}</p>
            ` : ''}
            
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Por favor, recordá enviarnos el comprobante de transferencia una vez realizado el pago para poder imputarlo correctamente en tu cuenta.</p>
          ` : `
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Este comprobante generó un saldo a tu favor que se aplicará automáticamente a tus próximos cargos.</p>
          `}
          
          <p style="color: #334155; font-size: 16px; font-weight: 500; margin-top: 25px;">¡Gracias por elegirnos y confiar en nuestro equipo!</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #64748b; font-size: 14px; margin: 0;">Atentamente,</p>
          <p style="color: #0f172a; font-size: 18px; font-weight: bold; margin: 5px 0 0 0;">${firma}</p>
        </div>
      </div>
    `;

    await sendEmail(correosDestino, `${titulo} - ${periodoStr} - ${firma}`, htmlEmail, undefined, senderEmail);

    // Marcar como enviado
    await prisma.accountTransaction.update({
      where: { id: tx.id },
      data: { isEmailed: true }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al enviar email html:', error);
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 });
  }
}
