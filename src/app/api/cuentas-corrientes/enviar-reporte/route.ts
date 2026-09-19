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
    const { clientId, viewMode } = data; // viewMode: 'ALL' | 'PENDING'

    if (!clientId) {
      return NextResponse.json({ error: 'Falta el ID del cliente' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { 
        defaultBankAccount: true,
        accountTransactions: {
          include: {
            paymentsApplied: true,
            chargesCovered: true
          },
          orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (!client.email || client.email === 'falta@email.com') {
      return NextResponse.json({ error: 'El cliente no tiene un email configurado' }, { status: 400 });
    }

    // Calcular saldos igual que en frontend y GET API
    let balance = 0;
    client.accountTransactions.forEach(tx => {
      if (tx.type === 'CHARGE') balance += tx.amount;
      else balance -= tx.amount;
    });

    let runningBalance = 0;
    const sortedTransactions = [...client.accountTransactions].sort((a, b) => {
      const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (timeDiff !== 0) return timeDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    const transactionsWithBalance = sortedTransactions.map(tx => {
      if (tx.type === 'CHARGE') runningBalance += tx.amount;
      else runningBalance -= tx.amount;
      return { ...tx, runningBalance };
    });

    // Revertir a orden descendente para mostrar las mas recientes primero
    transactionsWithBalance.reverse();

    // Filtrar segun viewMode
    const displayedTransactions = transactionsWithBalance.filter(tx => {
      if (viewMode === 'ALL') return true; // Mostrar todo
      // PENDING
      if (tx.type === 'CHARGE') {
        const applied = tx.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
        return applied < tx.amount;
      } else {
        const used = tx.chargesCovered.reduce((sum, app) => sum + app.amount, 0);
        return used < tx.amount;
      }
    });

    // Limitar transacciones si son MUCHAS y viewMode es ALL para no romper el email (ej. max 50)
    const finalTransactions = viewMode === 'ALL' ? displayedTransactions.slice(0, 50) : displayedTransactions;

    // Preparar variables de estilo
    const correosDestino = client.email.split(',').map(e => e.trim()).join(', ');
    const firma = client.professionalLabel === 'F' ? 'Estudio Milesi' : 'Estudio Contable F&J';
    const colorPrincipal = client.professionalLabel === 'F' ? '#0284c7' : '#4f46e5'; 
    const colorSecundario = client.professionalLabel === 'F' ? '#bae6fd' : '#c7d2fe'; 
    const logoUrl = 'https://raw.githubusercontent.com/Estudiomilesi/estudio-contable/main/public/logo-dark.png';
    const isDebt = balance > 0;
    const reportTitle = viewMode === 'PENDING' ? 'Composición de Saldos' : 'Estado de Cuenta Corriente';

    let desktopTableHtml = `
      <table class="desktop-only" width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin-top: 20px; font-size: 14px; text-align: left;">
        <thead>
          <tr style="background-color: ${colorPrincipal}; color: white;">
            <th style="padding: 10px; border-radius: 6px 0 0 0; white-space: nowrap; width: 12%;">Fecha</th>
            <th style="padding: 10px; width: 49%;">Concepto</th>
            <th style="padding: 10px; text-align: right; white-space: nowrap; width: 13%;">Debe</th>
            <th style="padding: 10px; text-align: right; white-space: nowrap; width: 13%;">Haber</th>
            <th style="padding: 10px; text-align: right; border-radius: 0 6px 0 0; white-space: nowrap; width: 13%;">Saldo</th>
          </tr>
        </thead>
        <tbody>
    `;

    let mobileCardsHtml = `
      <div class="mobile-only" style="display: none; max-height: 0; overflow: hidden; margin-top: 15px;">
    `;

    if (finalTransactions.length === 0) {
      desktopTableHtml += `
        <tr>
          <td colspan="5" style="padding: 15px; text-align: center; color: #64748b;">No hay movimientos para mostrar.</td>
        </tr>
      `;
      mobileCardsHtml += `<div style="padding: 15px; text-align: center; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px;">No hay movimientos para mostrar.</div>`;
    } else {
      finalTransactions.forEach((tx, i) => {
        const rowBg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
        const dateStr = new Date(tx.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const isCharge = tx.type === 'CHARGE';
        const debeStr = isCharge ? `$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-';
        const haberStr = !isCharge ? `$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-';
        const amountStr = `$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
        const saldoStr = `$${tx.runningBalance.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
        const descriptionStr = tx.description || (isCharge ? 'Cargo' : 'Pago');

        // Desktop Row
        desktopTableHtml += `
          <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 10px; color: #334155; white-space: nowrap;">${dateStr}</td>
            <td style="padding: 12px 10px; color: #334155; font-weight: 500;">${descriptionStr}</td>
            <td style="padding: 12px 10px; text-align: right; color: #dc2626; font-weight: 500; white-space: nowrap;">${debeStr}</td>
            <td style="padding: 12px 10px; text-align: right; color: #16a34a; font-weight: 500; white-space: nowrap;">${haberStr}</td>
            <td style="padding: 12px 10px; text-align: right; color: #0f172a; font-weight: bold; white-space: nowrap;">${saldoStr}</td>
          </tr>
        `;

        // Mobile Card
        mobileCardsHtml += `
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 13px; color: #64748b; font-weight: 600;">${dateStr}</span>
              <span style="font-size: 13px; font-weight: 700; color: ${isCharge ? '#dc2626' : '#16a34a'};">${isCharge ? 'Cargo' : 'Pago'}: ${amountStr}</span>
            </div>
            <div style="font-size: 14px; color: #334155; font-weight: 500; line-height: 1.4;">
              ${descriptionStr}
            </div>
          </div>
        `;
      });
    }

    desktopTableHtml += `
        </tbody>
      </table>
    `;
    
    mobileCardsHtml += `</div>`;
    
    let combinedHtml = desktopTableHtml + mobileCardsHtml;

    if (viewMode === 'ALL' && displayedTransactions.length > 50) {
      combinedHtml += `<p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 10px;">(Se muestran los últimos 50 movimientos. Consulte al estudio por el detalle histórico completo).</p>`;
    }

    const htmlEmail = `
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
      
      .desktop-only { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .mobile-only { display: block !important; max-height: none !important; overflow: visible !important; }
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
              <h2 class="header-title" style="color: #0f172a; margin: 0; font-size: 22px; border-bottom: 3px solid ${colorPrincipal}; padding-bottom: 5px; display: inline-block;">${reportTitle}</h2>
            </td>
            <td align="right" valign="middle">
              <img src="${logoUrl}" alt="${firma}" class="header-logo" style="max-height: 60px; opacity: 0.9;" />
            </td>
          </tr>
        </table>

        <p class="text-content" style="color: #334155; font-size: 16px;">Hola <strong>${client.name}</strong>,</p>
        <p class="text-content" style="color: #334155; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">Te enviamos el reporte de estado de tu cuenta corriente actualizado a la fecha.</p>
        
        <div class="status-box" style="background-color: ${isDebt ? '#fef2f2' : '#f0fdf4'}; border-left: 5px solid ${isDebt ? '#ef4444' : '#22c55e'}; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Estado actual:</strong></p>
          <p class="status-amount" style="margin: 0; font-size: 26px; color: ${isDebt ? '#b91c1c' : '#15803d'};">
            <strong>${isDebt ? 'Saldo a pagar:' : 'Saldo a favor:'} $${Math.abs(balance).toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong>
          </p>
        </div>

        ${combinedHtml}
        
        ${(isDebt && client.defaultBankAccount) ? `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 15px;">🏛️ Datos para transferencia</h3>
          <p style="margin: 0 0 6px 0; color: #475569; font-size: 14px;"><strong>Banco:</strong> ${client.defaultBankAccount.name}</p>
          ${client.defaultBankAccount.cbu ? `<p style="margin: 0 0 6px 0; color: #475569; font-size: 14px;"><strong>CBU/CVU:</strong> ${client.defaultBankAccount.cbu}</p>` : ''}
          ${client.defaultBankAccount.alias ? `<p style="margin: 0; color: #475569; font-size: 14px;"><strong>Alias:</strong> ${client.defaultBankAccount.alias}</p>` : ''}
        </div>
        ` : ''}
        
        <p class="text-content" style="color: #334155; font-size: 15px; line-height: 1.5; margin-top: 25px;">Por favor, recordá enviarnos el comprobante de transferencia una vez realizado el pago para poder imputarlo correctamente en tu cuenta.</p>
        
        <p class="text-content" style="color: #334155; font-size: 16px; font-weight: 500; margin-top: 20px;">¡Gracias por elegirnos y confiar en nuestro equipo!</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        
        <p style="color: #64748b; font-size: 14px; margin: 0;">Atentamente,</p>
        <p style="color: #0f172a; font-size: 18px; font-weight: bold; margin: 5px 0 0 0;">${firma}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    if (!process.env.SMTP_USER) {
      console.warn("SMTP no configurado. Simulado el envío de cuenta corriente a:", client.email);
    } else {
      await transporter.sendMail({
        from: `"${firma}" <${process.env.SMTP_USER}>`,
        to: correosDestino,
        subject: `${reportTitle} - ${firma}`,
        html: htmlEmail
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al enviar reporte de cuenta corriente:', error);
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 });
  }
}
