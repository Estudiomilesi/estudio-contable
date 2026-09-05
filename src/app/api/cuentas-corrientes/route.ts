import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const isJuanma = request.headers.get('x-is-juanma') === 'true';
    const whereClause: any = isJuanma ? { professionalLabel: { in: ['FJ', 'JF'] } } : {};

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
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
      },
      orderBy: { name: 'asc' }
    });

    const clientsWithBalances = clients.map(client => {
      let balance = 0; // Positive means debt (owes us), Negative means favor (we owe them)
      let unappliedPayments = 0;
      let unpaidCharges = 0;

      client.accountTransactions.forEach(tx => {
        if (tx.type === 'CHARGE') {
          balance += tx.amount;
          const appliedToThis = tx.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
          if (appliedToThis < tx.amount) {
            unpaidCharges += (tx.amount - appliedToThis);
          }
        } else { // PAYMENT
          balance -= tx.amount;
          const usedFromThis = tx.chargesCovered.reduce((sum, app) => sum + app.amount, 0);
          if (usedFromThis < tx.amount) {
            unappliedPayments += (tx.amount - usedFromThis);
          }
        }
      });

      let runningBalance = 0;
      
      // Sort ascending to calculate running balance
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

      return {
        id: client.id,
        code: client.code,
        name: client.name,
        professionalLabel: client.professionalLabel,
        balance,
        unappliedPayments,
        unpaidCharges,
        transactions: transactionsWithBalance.reverse()
      };
    });

    return NextResponse.json(clientsWithBalances);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener cuentas corrientes' }, { status: 500 });
  }
}
