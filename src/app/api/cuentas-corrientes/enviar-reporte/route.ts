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

    let tableHtml = `
      <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin-top: 20px; font-size: 14px; text-align: left;">
        <thead>
          <tr style="background-color: ${colorPrincipal}; color: white;">
            <th style="padding: 10px; border-radius: 6px 0 0 0;">Fecha</th>
            <th style="padding: 10px;">Concepto</th>
            <th style="padding: 10px; text-align: right;">Debe</th>
            <th style="padding: 10px; text-align: right;">Haber</th>
            <th style="padding: 10px; text-align: right; border-radius: 0 6px 0 0;">Saldo</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (finalTransactions.length === 0) {
      tableHtml += `
        <tr>
          <td colspan="5" style="padding: 15px; text-align: center; color: #64748b; border-bottom: 1px solid #e2e8f0;">No hay movimientos para mostrar.</td>
        </tr>
      `;
    } else {
      finalTransactions.forEach((tx, i) => {
        const rowBg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
        const dateStr = new Date(tx.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const debeStr = tx.type === 'CHARGE' ? `$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-';
        const haberStr = tx.type === 'PAYMENT' ? `$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-';
        
        // Si estamos en PENDING, mostrar el importe PENDIENTE real en lugar del original?
        // Fede en su PDF de composicion muestra el "Debe" original pero aclara el "Aplicado"?
        // Su frontend actual muestra el "Resta pagar" si es PENDING. Lo vamos a mantener simple mostrando el monto original de la tx o el monto pendiente.
        // Fede's frontend: `<td>{isCharge ? '$' + formatNumber(tx.amount) : '-'}</td>` 
        // He shows original amount in columns, but the running balance is the original tx running balance.

        const saldoStr = `$${tx.runningBalance.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;

        tableHtml += `
          <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; color: #334155;">${dateStr}</td>
            <td style="padding: 10px; color: #334155; font-weight: 500;">${tx.description || (tx.type === 'CHARGE' ? 'Cargo' : 'Pago')}</td>
            <td style="padding: 10px; text-align: right; color: #dc2626; font-weight: 500;">${debeStr}</td>
            <td style="padding: 10px; text-align: right; color: #16a34a; font-weight: 500;">${haberStr}</td>
            <td style="padding: 10px; text-align: right; color: #0f172a; font-weight: bold;">${saldoStr}</td>
          </tr>
        `;
      });
    }

    tableHtml += `
        </tbody>
      </table>
    `;

    if (viewMode === 'ALL' && displayedTransactions.length > 50) {
      tableHtml += `<p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 10px;">(Se muestran los últimos 50 movimientos. Consulte al estudio por el detalle histórico completo).</p>`;
    }

    const htmlEmail = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="padding: 30px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
            <tr>
              <td align="left" valign="middle">
                <h2 style="color: #1e293b; margin: 0; font-size: 22px; border-bottom: 3px solid ${colorPrincipal}; padding-bottom: 5px; display: inline-block;">${reportTitle}</h2>
              </td>
              <td align="right" valign="middle">
                <img src="${logoUrl}" alt="${firma}" style="max-height: 65px; opacity: 0.9;" />
              </td>
            </tr>
          </table>

          <p style="color: #334155; font-size: 16px;">Hola <strong>${client.name}</strong>,</p>
          <p style="color: #334155; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">Te enviamos el reporte de estado de tu cuenta corriente actualizado a la fecha.</p>
          
          <div style="background-color: ${isDebt ? '#fef2f2' : '#f0fdf4'}; border-left: 5px solid ${isDebt ? '#ef4444' : '#22c55e'}; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px;"><strong>Estado actual:</strong></p>
            <p style="margin: 0; font-size: 26px; color: ${isDebt ? '#b91c1c' : '#15803d'};">
              <strong>${isDebt ? 'Saldo a pagar:' : 'Saldo a favor:'} $${Math.abs(balance).toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong>
            </p>
          </div>

          ${tableHtml}
          
          ${(isDebt && client.defaultBankAccount) ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 15px;">🏛️ Datos para transferencia</h3>
            <p style="margin: 0 0 6px 0; color: #475569; font-size: 14px;"><strong>Banco:</strong> ${client.defaultBankAccount.name}</p>
            ${client.defaultBankAccount.cbu ? `<p style="margin: 0 0 6px 0; color: #475569; font-size: 14px;"><strong>CBU/CVU:</strong> ${client.defaultBankAccount.cbu}</p>` : ''}
            ${client.defaultBankAccount.alias ? `<p style="margin: 0; color: #475569; font-size: 14px;"><strong>Alias:</strong> ${client.defaultBankAccount.alias}</p>` : ''}
          </div>
          ` : ''}
          
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin-top: 25px;">Por favor, recordá enviarnos el comprobante de transferencia una vez realizado el pago para poder imputarlo correctamente en tu cuenta.</p>
          
          <p style="color: #334155; font-size: 16px; font-weight: 500; margin-top: 20px;">¡Gracias por elegirnos y confiar en nuestro equipo!</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #64748b; font-size: 14px; margin: 0;">Atentamente,</p>
          <p style="color: #0f172a; font-size: 18px; font-weight: bold; margin: 5px 0 0 0;">${firma}</p>
        </div>
      </div>
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
