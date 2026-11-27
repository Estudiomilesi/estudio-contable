import { prisma } from '@/lib/prisma';

export async function checkClosedMonth(dateInput: Date | string | null | undefined): Promise<{ isClosed: boolean; month: string; errorMsg?: string }> {
  if (!dateInput) return { isClosed: false, month: '' };
  let monthStr = '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}/.test(trimmed)) {
      monthStr = trimmed.slice(0, 7);
    } else {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) monthStr = d.toISOString().slice(0, 7);
    }
  } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    monthStr = dateInput.toISOString().slice(0, 7);
  }

  if (!monthStr) return { isClosed: false, month: '' };

  try {
    const closing = await prisma.monthClosing.findUnique({
      where: { month: monthStr }
    });
    if (closing && closing.isClosed) {
      return {
        isClosed: true,
        month: monthStr,
        errorMsg: `El período ${monthStr} se encuentra CERRADO. Para registrar, editar o eliminar movimientos de ese mes, primero debés reabrirlo desde "Cierre de Mes y Socios".`
      };
    }
  } catch (e) {
    // Table might not be migrated yet in edge cases
  }
  return { isClosed: false, month: monthStr };
}
