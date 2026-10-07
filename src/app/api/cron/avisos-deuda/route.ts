import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

// Protegemos el cron endpoint (Vercel manda esto en el header o podemos correrlo manual)
// Puedes invocarlo manualmente usando un secret o localmente sin secret.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Vercel Cron envia un Bearer con el CRON_SECRET, pero para testear podemos pasarlo por querystring
  const url = new URL(request.url);
  const isCronValid = authHeader === `Bearer ${process.env.CRON_SECRET}` || url.searchParams.get('key') === process.env.CRON_SECRET;
  
  if (process.env.CRON_SECRET && !isCronValid && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verificar si hoy es dia de envio: 10 o 20 (o el dia habil posterior si cayo finde)
  // Nota: ignorar esta verificacion si se llama forzado con ?force=true
  const isForce = url.searchParams.get('force') === 'true';
  const today = new Date();
  
  // Ajuste de zona horaria a Argentina (UTC-3)
  const argDateStr = today.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
  const argDate = new Date(argDateStr);
  const date = argDate.getDate();
  const dayOfWeek = argDate.getDay(); // 0 is Sunday, 1 is Monday

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
    // Buscar clientes activos que tengan deudas. Traemos transacciones para calcular.
    const clients = await prisma.client.findMany({
      where: { isActive: true },
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

      let balance = 0;
      client.accountTransactions.forEach(tx => {
        if (tx.type === 'CHARGE') balance += tx.amount;
        else balance -= tx.amount;
      });

      // Solo enviar aviso si la deuda es mayor a $100 pesos
      if (balance <= 100) continue;

      // Armar la composicion de saldos (solo pendientes)
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

    // Enviar correos en lotes para no saturar el SMTP
    let sentCount = 0;
    for (const { client, balance, displayedTransactions } of clientsToNotify) {
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
        sentCount++;
      } catch(err) {
        console.error('Error sending debt notice to', client.email, err);
      }
    }

    return NextResponse.json({ success: true, processed: clients.length, sentCount, message: `Notices sent to ${sentCount} clients.` });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Error processing debt notices' }, { status: 500 });
  }
}
