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
        chargesCovered: {
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
    const chargesMap = new Map();
    for (const tx of txs) {
      for (const app of tx.chargesCovered) {
        if (!chargesMap.has(app.charge.id)) {
          chargesMap.set(app.charge.id, { desc: app.charge.description, applied: 0 });
        }
        chargesMap.get(app.charge.id).applied += app.amount;
      }
    }
    
    let comprobantesHtml = '';
    if (chargesMap.size > 0) {
      comprobantesHtml = `
        <h3 style="margin: 25px 0 10px 0; color: #334155; font-size: 15px;">Comprobantes Cancelados</h3>
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

    const firma = process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' 
      ? 'Estudio Jurídico Cicconi' 
      : (client.professionalLabel === 'F' ? 'Estudio Milesi' : 'Estudio Contable F&J');
    const colorPrincipal = '#7C4751'; 
    const logoUrl = 'https://raw.githubusercontent.com/Estudiomilesi/estudio-contable/main/public/logo-dark.png';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 10px !important; }
      .email-container { padding: 15px !important; border-radius: 8px !important; }
      .header-title { font-size: 18px !important; }
      .header-logo { max-height: 45px !important; }
      .text-content { font-size: 15px !important; }
      .status-box { padding: 15px !important; }
      .status-amount { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div class="email-wrapper" style="padding: 20px; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;">
    <div class="email-container" style="max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="padding: 30px;" class="email-container">
        
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
          <tr>
            <td align="left" valign="middle">
              <h2 class="header-title" style="color: #0f172a; margin: 0; font-size: 22px; border-bottom: 3px solid ${colorPrincipal}; padding-bottom: 5px; display: inline-block;">Recibo de Pago</h2>
            </td>
            <td align="right" valign="middle">
              <img src="${logoUrl}" alt="${firma}" class="header-logo" style="max-height: 60px; opacity: 0.9;" />
            </td>
          </tr>
        </table>

        <p class="text-content" style="color: #334155; font-size: 16px;">Hola <strong>${client.name}</strong>,</p>
        <p class="text-content" style="color: #334155; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">Acabamos de registrar tu pago. A continuación te dejamos el detalle.</p>
        
        <div class="status-box" style="background-color: #f0fdf4; border-left: 5px solid #22c55e; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <table width="100%">
            <tr>
              <td>
                <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Fecha del pago:</strong> ${dateStr}</p>
              </td>
              <td align="right">
                <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Total Recibido:</strong></p>
                <p class="status-amount" style="margin: 0; font-size: 26px; color: #15803d;">
                  <strong>$${totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong>
                </p>
              </td>
            </tr>
          </table>
        </div>

        <h3 style="margin: 25px 0 10px 0; color: #334155; font-size: 15px;">Detalle del Pago</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          ${mediosPagoHtml}
        </table>

        ${comprobantesHtml}
        
        <p class="text-content" style="color: #334155; font-size: 16px; font-weight: 500; margin-top: 40px; text-align: center;">¡Gracias por confiar en nuestro equipo!</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        
        <div style="text-align: center; color: #64748b; font-size: 13px;">
          <p style="margin: 0 0 5px 0;"><strong>${firma}</strong></p>
          <p style="margin: 0;">Este documento es generado automáticamente y sirve como comprobante válido de pago.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const senderEmail = request.headers.get('x-user-email') || userEmail || 'fedenilomilesi@gmail.com';
    await sendEmail(
      client.email,
      `Recibo de Pago - ${client.name}`,
      htmlContent,
      [],
      senderEmail
    );

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
