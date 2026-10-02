import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const { accountTxIds, userEmail } = await request.json();

    if (!accountTxIds || !Array.isArray(accountTxIds) || accountTxIds.length === 0) {
      return NextResponse.json({ error: 'IDs de transacciones requeridos' }, { status: 400 });
    }

    const txs = await prisma.accountTransaction.findMany({
      where: { id: { in: accountTxIds } },
      include: {
        client: true,
        paymentsApplied: {
          include: {
            charge: true
          }
        }
      }
    });

    if (txs.length === 0) {
      return NextResponse.json({ error: 'No se encontraron las transacciones' }, { status: 404 });
    }

    const client = txs[0].client;
    const totalAmount = txs.reduce((acc, tx) => acc + tx.amount, 0);
    const date = txs[0].date;
    const dateStr = new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Detalle de medios de pago
    let mediosPagoHtml = '';
    for (const tx of txs) {
      mediosPagoHtml += `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${tx.description || 'Pago'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; text-align: right; font-weight: bold;">$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
      </tr>`;
    }

    // Detalle de comprobantes cancelados
    // Consolidamos para no repetir
    const chargesMap = new Map();
    for (const tx of txs) {
      for (const app of tx.paymentsApplied) {
        if (!chargesMap.has(app.charge.id)) {
          chargesMap.set(app.charge.id, { desc: app.charge.description, applied: 0 });
        }
        chargesMap.get(app.charge.id).applied += app.amount;
      }
    }
    
    let comprobantesHtml = '';
    if (chargesMap.size > 0) {
      comprobantesHtml = `
        <h3 style="margin: 25px 0 10px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Comprobantes Imputados</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      `;
      
      for (const [_, charge] of chargesMap) {
        comprobantesHtml += `<tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">${charge.desc || 'Comprobante'}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: right;">$${charge.applied.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
        </tr>`;
      }
      comprobantesHtml += `</table>`;
    }

    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px;">
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td>
              <h2 style="margin: 0; color: #0f172a; font-size: 24px;">Recibo de Pago</h2>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Fecha: ${dateStr}</p>
            </td>
            <td style="text-align: right;">
              <div style="background-color: #7C4751; color: white; padding: 10px 20px; border-radius: 6px; display: inline-block;">
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Total Recibido</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">$${totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Recibimos de</p>
          <p style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 500;">${client.name}</p>
        </div>

        <h3 style="margin: 0 0 10px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Detalle del Pago</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          ${mediosPagoHtml}
        </table>

        ${comprobantesHtml}
        
        <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-top: 30px; text-align: center;">
          El presente recibo es comprobante válido por el pago realizado.<br>
          ¡Gracias por confiar en nosotros!
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">Estudio Milesi & Asociados</p>
        </div>
      </div>
    `;

    const senderEmail = request.headers.get('x-user-email') || userEmail || 'fedenilomilesi@gmail.com';
    await sendEmail(
      client.email,
      `Recibo de Pago - ${client.name}`,
      htmlContent,
      [], // No attachments
      senderEmail
    );

    // Marcar como enviados
    await prisma.accountTransaction.updateMany({
      where: { id: { in: accountTxIds } },
      data: { isEmailed: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error enviando recibo:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
