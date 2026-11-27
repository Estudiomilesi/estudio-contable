import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseToUtcNoon } from '@/lib/dateUtils';
import { checkClosedMonth } from '@/lib/monthLock';

export async function POST(request: Request) {
  try {
    const isJuanma = request.headers.get('x-is-juanma') === 'true';
    const userEmail = request.headers.get('x-user-email') || 'federico@estudiomilesi.com';
    if (isJuanma) {
      return NextResponse.json({ error: 'No autorizado para realizar cierres de mes' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Acción 1: Cerrar mes y trasladar saldos al mes siguiente
    if (action === 'CLOSE_MONTH') {
      const {
        month,
        saldoInicialFedeF,
        saldoInicialFedeFJ,
        saldoInicialJuanmaFJ,
        resultadoF,
        resultadoFJ,
        retirosFedeF,
        retirosFedeFJ,
        retirosJuanmaFJ,
        saldoFinalFedeF,
        saldoFinalFedeFJ,
        saldoFinalJuanmaFJ
      } = body;

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: 'Mes inválido' }, { status: 400 });
      }

      const closing = await prisma.monthClosing.upsert({
        where: { month },
        update: {
          isClosed: true,
          saldoInicialFedeF: Number(saldoInicialFedeF) || 0,
          saldoInicialFedeFJ: Number(saldoInicialFedeFJ) || 0,
          saldoInicialJuanmaFJ: Number(saldoInicialJuanmaFJ) || 0,
          resultadoF: Number(resultadoF) || 0,
          resultadoFJ: Number(resultadoFJ) || 0,
          retirosFedeF: Number(retirosFedeF) || 0,
          retirosFedeFJ: Number(retirosFedeFJ) || 0,
          retirosJuanmaFJ: Number(retirosJuanmaFJ) || 0,
          saldoFinalFedeF: Number(saldoFinalFedeF) || 0,
          saldoFinalFedeFJ: Number(saldoFinalFedeFJ) || 0,
          saldoFinalJuanmaFJ: Number(saldoFinalJuanmaFJ) || 0,
          closedAt: new Date(),
          closedBy: userEmail
        },
        create: {
          month,
          isClosed: true,
          saldoInicialFedeF: Number(saldoInicialFedeF) || 0,
          saldoInicialFedeFJ: Number(saldoInicialFedeFJ) || 0,
          saldoInicialJuanmaFJ: Number(saldoInicialJuanmaFJ) || 0,
          resultadoF: Number(resultadoF) || 0,
          resultadoFJ: Number(resultadoFJ) || 0,
          retirosFedeF: Number(retirosFedeF) || 0,
          retirosFedeFJ: Number(retirosFedeFJ) || 0,
          retirosJuanmaFJ: Number(retirosJuanmaFJ) || 0,
          saldoFinalFedeF: Number(saldoFinalFedeF) || 0,
          saldoFinalFedeFJ: Number(saldoFinalFedeFJ) || 0,
          saldoFinalJuanmaFJ: Number(saldoFinalJuanmaFJ) || 0,
          closedAt: new Date(),
          closedBy: userEmail
        }
      });

      return NextResponse.json({ success: true, closing });
    }

    // Acción 2: Reabrir mes cerrado para permitir ajustes
    if (action === 'REOPEN_MONTH') {
      const { month } = body;
      if (!month) {
        return NextResponse.json({ error: 'Mes requerido' }, { status: 400 });
      }

      const closing = await prisma.monthClosing.update({
        where: { month },
        data: { isClosed: false }
      });

      return NextResponse.json({ success: true, closing });
    }

    // Acción 3: Compensación directa entre socios (sin alterar el saldo neto de Caja física)
    if (action === 'COMPENSATE_PARTNERS') {
      const { date, fromPartner, amount, description } = body;
      const amt = Math.abs(parseFloat(amount) || 0);
      if (!date || amt <= 0 || (fromPartner !== 'JUANMA_TO_FEDE' && fromPartner !== 'FEDE_TO_JUANMA')) {
        return NextResponse.json({ error: 'Datos de compensación inválidos' }, { status: 400 });
      }

      const lockCheck = await checkClosedMonth(date);
      if (lockCheck.isClosed) {
        return NextResponse.json({ error: lockCheck.errorMsg }, { status: 400 });
      }

      const txDate = parseToUtcNoon(date);
      const payerCategory = fromPartner === 'JUANMA_TO_FEDE' ? 'Retiro Juanma' : 'Retiro Fede';
      const receiverCategory = fromPartner === 'JUANMA_TO_FEDE' ? 'Retiro Fede' : 'Retiro Juanma';
      const desc = description
        ? `Compensación entre socios: ${description}`
        : fromPartner === 'JUANMA_TO_FEDE'
          ? 'Compensación directa entre socios (Aporte Juanma a Fede)'
          : 'Compensación directa entre socios (Aporte Fede a Juanma)';

      // 1. El socio que devuelve/transfiere registra un Aporte/Reintegro (INCOME -> reduce sus retiros del mes)
      const txIn = await prisma.treasuryTransaction.create({
        data: {
          date: txDate,
          amount: amt,
          type: 'INCOME',
          account: 'CAJA',
          category: payerCategory,
          description: desc
        }
      });

      // 2. El socio que recibe registra un Retiro (EXPENSE -> aumenta sus retiros del mes), dejando la Caja en $0 neto
      await prisma.treasuryTransaction.create({
        data: {
          date: txDate,
          amount: -amt,
          type: 'EXPENSE',
          account: 'CAJA',
          category: receiverCategory,
          description: desc,
          parentTransactionId: txIn.id
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en cierre de mes:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
