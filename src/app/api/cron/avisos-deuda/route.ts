import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  const url = new URL(request.url);
  const isCronValid = authHeader === `Bearer ${process.env.CRON_SECRET}` || url.searchParams.get('key') === process.env.CRON_SECRET;
  
  if (process.env.CRON_SECRET && !isCronValid && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  const isForce = url.searchParams.get('force') === 'true';
  const forceClientName = url.searchParams.get('client');
  const today = new Date();
  
  const argDateStr = today.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
  const argDate = new Date(argDateStr);
  const date = argDate.getDate();
  const dayOfWeek = argDate.getDay(); 

  let shouldSend = false;

  if ((date === 10 || date === 20) && dayOfWeek >= 1 && dayOfWeek <= 5) {
    shouldSend = true;
  } else if (dayOfWeek === 1 && (date === 11 || date === 12 || date === 21 || date === 22)) {
    shouldSend = true;
  }

  if (!shouldSend && !isForce) {
    return NextResponse.json({ message: 'No es el dia objetivo para enviar avisos de deuda', date, dayOfWeek });
  }

  try {
    let whereClause: any = { isActive: true };
    if (forceClientName) {
      whereClause.name = { contains: forceClientName, mode: 'insensitive' };
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        defaultBankAccount: true,
        accountTransactions: {
          include: { paymentsApplied: true, chargesCovered: true },
          orderBy: [ { date: 'desc' }, { createdAt: 'desc' } ]
        }
      }
    });

    const clientsToNotify = [];

    for (const client of clients) {
      if (!client.email || client.email === 'falta@email.com') continue;

      // Skip si ya se le envio el aviso HOY
      if (client.lastDebtNoticeSent) {
        const diffHours = (today.getTime() - client.lastDebtNoticeSent.getTime()) / (1000 * 60 * 60);
        if (diffHours < 20 && !isForce) {
          continue; // Ya se envio recientemente
        }
      }

      let balance = 0;
      client.accountTransactions.forEach(tx => {
        if (tx.type === 'CHARGE') balance += tx.amount;
        else balance -= tx.amount;
      });

      // Saldo mayor a 10.000
      if (balance <= 10000) continue;

      let runningBalance = 0;
      const sortedTransactions = [...client.accountTransactions].sort((a, b) => {
        const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return timeDiff !== 0 ? timeDiff : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const transactionsWithBalance = sortedTransactions.map(tx => {
        if (tx.type === 'CHARGE') runningBalance += tx.amount;
        else runningBalance -= tx.amount;
        return { ...tx, runningBalance };
      });

      transactionsWithBalance.reverse();

      const displayedTransactions = transactionsWithBalance.filter(tx => {
        if (tx.type === 'CHARGE') {
          const applied = tx.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
          return applied < tx.amount;
        } else {
          const used = tx.chargesCovered.reduce((sum, app) => sum + app.amount, 0);
          return used < tx.amount;
        }
      });

      clientsToNotify.push({ client, balance, displayedTransactions });
    }

    // Tomar solo 10 para respetar limites de tiempo
    const batch = forceClientName ? clientsToNotify : clientsToNotify.slice(0, 10);
    
    let sentCount = 0;
    for (const { client, balance, displayedTransactions } of batch) {
      const correosDestino = client.email.split(',').map((e: string) => e.trim()).join(', ');
      const firma = process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' 
        ? 'Estudio Jurídico Cicconi' 
        : (client.professionalLabel === 'F' ? 'Estudio Milesi' : 'Estudio Contable F&J');
      const colorPrincipal = '#7C4751'; 
      const colorSecundario = '#F5ECE7'; 

      let tableHtml = `
        <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin-top: 20px; font-size: 14px; text-align: left;">
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

      displayedTransactions.forEach((tx, idx) => {
        const isCharge = tx.type === 'CHARGE';
        const isOdd = idx % 2 === 1;
        const bg = isOdd ? '#f8fafc' : '#ffffff';
        
        const dateObj = new Date(tx.date);
        const dateStr = dateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric' });
        
        let label = tx.description || 'Comprobante';
        if (tx.receiptNumber) label += ` - N° ${tx.receiptNumber}`;

        const debe = isCharge ? `$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-';
        const haber = !isCharge ? `$${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-';
        
        const debeColor = isCharge ? '#dc2626' : '#64748b';
        const haberColor = !isCharge ? '#16a34a' : '#64748b';

        tableHtml += `
          <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; color: #64748b;">${dateStr}</td>
            <td style="padding: 10px; color: #334155;">${label}</td>
            <td style="padding: 10px; text-align: right; color: ${debeColor}; font-weight: bold;">${debe}</td>
            <td style="padding: 10px; text-align: right; color: ${haberColor}; font-weight: bold;">${haber}</td>
            <td style="padding: 10px; text-align: right; color: #0f172a; font-weight: bold;">$${tx.runningBalance.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          </tr>
        `;
      });
      tableHtml += `</tbody></table>`;

      let bankHtml = '';
      if (client.defaultBankAccount) {
        bankHtml = `
          <div style="margin-top: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; color: #334155; font-size: 16px; margin-bottom: 15px;">🏦 Datos para transferencia</h3>
            <p style="margin: 5px 0; color: #475569; font-size: 14px;"><strong>Banco:</strong> ${client.defaultBankAccount.name}</p>
            <p style="margin: 5px 0; color: #475569; font-size: 14px;"><strong>CBU/CVU:</strong> ${client.defaultBankAccount.cbu}</p>
            <p style="margin: 5px 0; color: #475569; font-size: 14px;"><strong>Alias:</strong> ${client.defaultBankAccount.alias}</p>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
            Por favor, recordá enviarnos el comprobante de transferencia una vez realizado el pago para poder imputarlo correctamente en tu cuenta.
          </p>
        `;
      }

      const htmlEmail = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin-bottom: 10px; font-size: 24px;">Aviso de Deuda Pendiente</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">${firma}</p>
            <hr style="border: 0; border-top: 2px solid ${colorPrincipal}; margin: 15px 0;" />
          </div>

          <p style="font-size: 16px; color: #334155;">Hola <strong>${client.name}</strong>,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">
            Te escribimos para recordarte que tenés saldo pendiente a abonar. A continuación te detallamos la composición de tu deuda actualizada a la fecha.
          </p>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #475569; font-size: 14px;">Estado actual:</p>
            <h2 style="margin: 5px 0 0 0; color: #b91c1c; font-size: 24px;">Saldo a pagar: $${balance.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
          </div>

          ${tableHtml}
          ${bankHtml}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">¡Gracias por elegirnos y confiar en nuestro equipo!</p>
            <p style="color: #334155; font-size: 14px; font-weight: bold; margin-top: 10px;">Atentamente,<br/>${firma}</p>
          </div>
        </div>
      `;

      try {
        await sendEmail(correosDestino, `Aviso de Deuda - ${firma}`, htmlEmail);
        await prisma.client.update({
          where: { id: client.id },
          data: { lastDebtNoticeSent: today }
        });
        sentCount++;
      } catch(err) {
        console.error('Error sending debt notice to', client.email, err);
      }
    }

    return NextResponse.json({ success: true, processed: batch.length, sentCount, pendingRemaining: clientsToNotify.length - batch.length });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Error processing debt notices' }, { status: 500 });
  }
}
