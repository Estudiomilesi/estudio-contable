import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseToUtcNoon } from '@/lib/dateUtils';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const description = data.description || 'Abono Mensual';
    // Usar la URL cruda de GitHub garantiza que el logo siempre cargue en Gmail y otros clientes
    const logoUrl = 'https://raw.githubusercontent.com/Estudiomilesi/estudio-contable/main/public/logo-dark.png';

    const billingDate = parseToUtcNoon(data.billingDate);
    const clientIds = data.clientIds || [];
    const billingProfileOverrides = data.billingProfileOverrides || {};
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesActual = meses[billingDate.getMonth()];
    const anoActual = billingDate.getFullYear();
    const periodoStr = `${mesActual} ${anoActual}`;

    // Obtener los clientes (incluyendo datos bancarios para el mail)
    const clientes = await prisma.client.findMany({
      where: { 
        isActive: true,
        currentFee: { gt: 0 },
        ...(clientIds.length > 0 ? { id: { in: clientIds } } : {})
      },
      include: {
        defaultBankAccount: true
      }
    });

    // Obtener el último número de comprobante ABON- para seguir la secuencia
    const lastAbono = await prisma.accountTransaction.findFirst({
      where: { receiptNumber: { startsWith: 'ABON-' } },
      orderBy: { receiptNumber: 'desc' }
    });
    
    let nextAbonoNum = 1;
    if (lastAbono && lastAbono.receiptNumber) {
      const match = lastAbono.receiptNumber.match(/ABON-(\d+)/);
      if (match) {
        nextAbonoNum = parseInt(match[1], 10) + 1;
      }
    }

    let emailsEnviados = 0;
    const transacciones = [];

    for (const cliente of clientes) {
      // Determinar perfil a usar: override > default
      let profile = billingProfileOverrides[cliente.id] || cliente.defaultBillingProfile;
      if (!profile) profile = 'NO_FISCAL';

      const netAmount = cliente.currentFee;
      let ivaAmount = 0;

      if (profile === 'FEDE_RI') {
        ivaAmount = netAmount * 0.21;
      }

      const totalAmount = netAmount + ivaAmount;
      
      // Generar el número de comprobante consecutivo ABON-0000000X
      const receiptNumber = `ABON-${String(nextAbonoNum).padStart(7, '0')}`;
      nextAbonoNum++;

      // Enviar email si tiene perfil NO_FISCAL y un email válido
      const debeEnviarEmailInmediato = profile === 'NO_FISCAL';

      const transaccion = await prisma.accountTransaction.create({
        data: {
          clientId: cliente.id,
          date: billingDate,
          type: 'CHARGE',
          amount: totalAmount,
          netAmount,
          ivaAmount,
          billingProfile: profile,
          description: `${description} - ${periodoStr}`,
          receiptNumber: receiptNumber,
          isEmailed: debeEnviarEmailInmediato // Si es fiscal queda en false (pendiente de envío)
        }
      });
      transacciones.push(transaccion);

      if (debeEnviarEmailInmediato && cliente.email && cliente.email !== 'falta@email.com') {
        const correosDestino = cliente.email.split(',').map(e => e.trim()).join(', ');
        
        // Determinar firma en base a la etiqueta profesional
        const firma = cliente.professionalLabel === 'F' ? 'Estudio Milesi' : 'Estudio Contable F&J';
        const colorPrincipal = cliente.professionalLabel === 'F' ? '#0284c7' : '#4f46e5'; // Cyan oscuro para F, Índigo para F&J
        const colorFondoEtiqueta = cliente.professionalLabel === 'F' ? '#e0f2fe' : '#e0e7ff'; // Fondo pastel
        const colorTextoEtiqueta = cliente.professionalLabel === 'F' ? '#0369a1' : '#4338ca'; // Texto oscuro

        const htmlEmail = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <div style="padding: 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="left" valign="middle">
                    <h2 style="color: #1e293b; margin: 0; font-size: 22px; border-bottom: 3px solid ${colorPrincipal}; padding-bottom: 5px; display: inline-block;">Aviso de Honorarios</h2>
                  </td>
                  <td align="right" valign="middle">
                    <img src="${logoUrl}" alt="${firma}" style="max-height: 65px; opacity: 0.9;" />
                  </td>
                </tr>
              </table>

              <p style="color: #334155; font-size: 16px;">Hola <strong>${cliente.name}</strong>,</p>
              <p style="color: #334155; font-size: 16px;">Esperamos que te encuentres muy bien.</p>
              <p style="color: #334155; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">Te enviamos el detalle de los honorarios correspondientes al período <span style="background-color: ${colorFondoEtiqueta}; color: ${colorTextoEtiqueta}; padding: 4px 12px; border-radius: 16px; font-weight: bold; font-size: 15px; display: inline-block; border: 1px solid ${colorPrincipal}; margin-top: 4px; white-space: nowrap;">${periodoStr}</span>.</p>
              
              <!-- Recuadro llamativo del importe -->
              <div style="background-color: #f8fafc; border-left: 5px solid ${colorPrincipal}; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px; line-height: 1.6;"><strong>Comprobante interno:</strong> <span style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #475569; white-space: nowrap;">${receiptNumber}</span></p>
                <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.8;">
                  <strong>Concepto:</strong> 
                  <span style="background-color: ${colorFondoEtiqueta}; color: ${colorTextoEtiqueta}; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block; margin-top: 4px;">Honorarios Contables - Abono Mensual</span>
                </p>
                <p style="margin: 0; font-size: 24px; color: ${colorPrincipal};"><strong>Total a pagar: $${totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></p>
              </div>
              
              <!-- Datos bancarios -->
              ${cliente.defaultBankAccount ? `
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 16px;">🏛️ Datos para transferencia</h3>
                <p style="margin: 0 0 6px 0; color: #15803d; font-size: 15px;"><strong>Banco:</strong> ${cliente.defaultBankAccount.name}</p>
                ${cliente.defaultBankAccount.cbu ? `<p style="margin: 0 0 6px 0; color: #15803d; font-size: 15px;"><strong>CBU/CVU:</strong> ${cliente.defaultBankAccount.cbu}</p>` : ''}
                ${cliente.defaultBankAccount.alias ? `<p style="margin: 0; color: #15803d; font-size: 15px;"><strong>Alias:</strong> ${cliente.defaultBankAccount.alias}</p>` : ''}
              </div>
              ` : ''}
              
              <p style="color: #334155; font-size: 15px; line-height: 1.5;">Por favor, recordá enviarnos el comprobante de transferencia una vez realizado el pago para poder imputarlo correctamente en tu cuenta.</p>
              
              <p style="color: #334155; font-size: 16px; font-weight: 500; margin-top: 25px;">¡Gracias por elegirnos y confiar en nuestro equipo!</p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              
              <p style="color: #64748b; font-size: 14px; margin: 0;">Atentamente,</p>
              <p style="color: #0f172a; font-size: 18px; font-weight: bold; margin: 5px 0 0 0;">${firma}</p>
            </div>
          </div>
        `;

        try {
          await sendEmail(
            correosDestino, 
            `Aviso de Honorarios - ${periodoStr} - ${firma}`, 
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
