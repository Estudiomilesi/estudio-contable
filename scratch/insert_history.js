const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rows = [
  { date: '2026-09-02T12:00:00Z', cat: 'Honorarios', client: 'FRANCO ALBERTO BUDASSI', acc: 'BANCOS FEDE', amt: 219615, desc: '181.500 Honorarios 38.115 IVA' },
  { date: '2026-09-02T12:00:00Z', cat: 'Honorarios', client: 'MALVESTITI PAOLA', acc: 'BANCOS JUANMA', amt: 13500 },
  { date: '2026-09-02T12:00:00Z', cat: 'Honorarios', client: 'AGAS SRL', acc: 'BANCOS FEDE', amt: 811625.34 },
  { date: '2026-09-02T12:00:00Z', cat: 'Honorarios', client: 'MAIDANA HUGO', acc: 'CAJA', amt: 38000 },
  { date: '2026-09-02T12:00:00Z', cat: 'Sueldos', emp: 'Lucho', acc: 'CAJA', amt: -2053835.55, desc: 'Sueldo Lucho' },
  { date: '2026-09-02T12:00:00Z', cat: 'Gastos Generales', acc: 'CAJA', amt: -229625, desc: 'Alquiler La Maquinita' },
  { date: '2026-09-02T12:00:00Z', cat: 'Honorarios', client: 'AYESTARAN GUILLERMO', acc: 'BANCOS FEDE', amt: 48000 },
  { date: '2026-09-02T12:00:00Z', cat: 'Honorarios', client: 'PIERUCCI DAMIAN', acc: 'BANCOS FEDE', amt: 34500 },
  { date: '2026-09-02T12:00:00Z', cat: 'Honorarios', client: 'BELTRAME RICARDO', acc: 'BANCOS FEDE', amt: 24000 },
  { date: '2026-09-02T12:00:00Z', cat: 'Honorarios', client: 'ELVIA NATALI FERREYRA', acc: 'BANCOS FEDE', amt: 22500 },
  { date: '2026-09-02T12:00:00Z', cat: 'Honorarios', client: 'JORGE LUIS HUIDOBRO ORELLANA', acc: 'BANCOS FEDE', amt: 27500 },
  { date: '2026-09-02T12:00:00Z', cat: 'Retiro Fede', acc: 'CAJA', amt: -311.35, desc: 'AJUSTE' },
  { date: '2026-09-01T12:00:00Z', cat: 'Sueldos', emp: 'Noe', acc: 'CAJA', amt: -1717800, desc: 'Sueldo Noe' },
  { date: '2026-09-01T12:00:00Z', cat: 'Sueldos', emp: 'Juli', acc: 'BANCOS JUANMA', amt: -575413, desc: 'Sueldo Juli' },
  { date: '2026-09-01T12:00:00Z', cat: 'Sueldos', emp: 'Alma', acc: 'CAJA', amt: -570000, desc: 'Sueldo Alma' },
  { date: '2026-09-01T12:00:00Z', cat: 'Sueldos', emp: 'Belén', acc: 'CAJA', amt: -700000, desc: 'Sueldo Belen' },
  { date: '2026-09-01T12:00:00Z', cat: 'Sueldos', emp: 'Pauli', acc: 'CAJA', amt: -490000, desc: 'Sueldo Paula' },
  { date: '2026-09-01T12:00:00Z', cat: 'Sueldos', emp: 'Luichi', acc: 'CAJA', amt: -728810, desc: 'Sueldo Luichi' },
  { date: '2026-09-01T12:00:00Z', cat: 'Sueldos', emp: 'Luichi', acc: 'BANCOS JUANMA', amt: -315000, desc: 'Sueldo Luichi' },
  { date: '2026-09-01T12:00:00Z', cat: 'Sueldos', emp: 'Lucho', acc: 'CAJA', amt: -1148000, desc: 'Sueldo Luchi' },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'FONIAGRO', acc: 'CAJA', amt: 375000 },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'TIERRA PARANA CEREALES SRL', acc: 'CAJA', amt: 515000, desc: '14:04' },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'DISTRIBUIDORA J & G SRL', acc: 'BANCOS FEDE', amt: 177000 },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'NENCIONI ALEJO', acc: 'BANCOS FEDE', amt: 123000 },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'PETRELLI FERNANDO', acc: 'BANCOS FEDE', amt: 188000 },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'NENCIONI GUSTAVO', acc: 'BANCOS FEDE', amt: 148000 },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'AYESTARAN IGNACIO', acc: 'BANCOS FEDE', amt: 35000 },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'CAMPOS AGUSTINA', acc: 'BANCOS FEDE', amt: 88000 },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'MATIAS STIPICH', acc: 'BANCOS FEDE', amt: 24000 },
  
  // Pase de caja: Receive check
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'CARNEVALI ROMAN DAVID', acc: 'CHEQUES', amt: 2855000 },
  // Pase de caja: Withdraw check to CAJA IVA
  { date: '2026-09-01T12:00:00Z', cat: 'Pase de Caja', acc: 'CHEQUES', amt: -2855000, type: 'TRANSFER', desc: 'Pase a CAJA IVA' },
  // Pase de caja: Deposit check in CAJA IVA
  { date: '2026-09-01T12:00:00Z', cat: 'Pase de Caja', acc: 'CAJA IVA', amt: 2855000, type: 'TRANSFER', desc: 'Ingreso desde Cheques' },

  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'EDUARDO MIGUEL HANSEN', acc: 'BANCOS FEDE', amt: 644325, desc: '532.500 honorarios, 111.825 IVA' },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'LUCHETTI NESTOR', acc: 'CAJA', amt: 34000 },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'TIERRA PARANA CEREALES SRL', acc: 'CAJA', amt: 515000, desc: '09:06' },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'CORREA ALDANA', acc: 'BANCOS JUANMA', amt: 14500 },
  { date: '2026-09-01T12:00:00Z', cat: 'Honorarios', client: 'ANDRES GERARDO LAMBOY', acc: 'BANCOS FEDE', amt: 66000 }
];

async function main() {
  const clients = await prisma.client.findMany();
  const employees = await prisma.employee.findMany();

  let cajaDiff = 0;
  let cajaIvaDiff = 0;
  let chequeDiff = 0;

  for (const row of rows) {
    let clientId = null;
    if (row.client) {
      const found = clients.find(c => c.name.toLowerCase().includes(row.client.toLowerCase().split(' ')[0]));
      if (found) clientId = found.id;
      else console.log("CLIENT NOT FOUND:", row.client);
    }

    let employeeId = null;
    if (row.emp) {
      const found = employees.find(e => e.name.toLowerCase() === row.emp.toLowerCase());
      if (found) employeeId = found.id;
      else if (row.emp === 'Belén') employeeId = employees.find(e => e.name.toLowerCase().includes('bel')).id;
    }

    const type = row.type ? row.type : (row.amt > 0 ? 'INCOME' : 'EXPENSE');
    
    // Create main transaction
    const tx = await prisma.treasuryTransaction.create({
      data: {
        date: new Date(row.date),
        amount: row.amt,
        type: type,
        account: row.acc,
        category: row.cat,
        description: row.desc || 'Migración inicial',
        clientId,
        employeeId
      }
    });
    console.log(`Created TX ${row.acc} ${row.amt}`);

    // Auto Withdrawals/Reimbursements for Banks
    if (row.acc === 'BANCOS FEDE' || row.acc === 'BANCOS JUANMA') {
      const retiroSocio = row.acc === 'BANCOS FEDE' ? 'Retiro Fede' : 'Retiro Juanma';
      if (type === 'INCOME') {
        await prisma.treasuryTransaction.create({
          data: {
            date: new Date(row.date),
            amount: -Math.abs(row.amt),
            type: 'EXPENSE',
            account: row.acc,
            category: retiroSocio,
            description: `Retiro automático s/ cobro`,
            clientId
          }
        });
      } else if (type === 'EXPENSE') {
        await prisma.treasuryTransaction.create({
          data: {
            date: new Date(row.date),
            amount: Math.abs(row.amt),
            type: 'INCOME',
            account: row.acc,
            category: retiroSocio,
            description: `Reintegro automático por pago de gasto`,
            clientId
          }
        });
      }
    } else {
      // Accumulate diffs for CAJA, CAJA IVA, CHEQUES
      if (row.acc === 'CAJA') cajaDiff += row.amt;
      if (row.acc === 'CAJA IVA') cajaIvaDiff += row.amt;
      if (row.acc === 'CHEQUES') chequeDiff += row.amt;
    }
  }

  // Offset Saldo Inicial
  if (cajaDiff !== 0) {
    const siCaja = await prisma.treasuryTransaction.findFirst({
      where: { account: 'CAJA', category: 'Saldo Inicial' }
    });
    if (siCaja) {
      await prisma.treasuryTransaction.update({
        where: { id: siCaja.id },
        data: { amount: siCaja.amount - cajaDiff }
      });
      console.log(`Adjusted CAJA Saldo Inicial by ${-cajaDiff}. New: ${siCaja.amount - cajaDiff}`);
    }
  }

  if (cajaIvaDiff !== 0) {
    const siCajaIva = await prisma.treasuryTransaction.findFirst({
      where: { account: 'CAJA IVA', category: 'Saldo Inicial' }
    });
    if (siCajaIva) {
      await prisma.treasuryTransaction.update({
        where: { id: siCajaIva.id },
        data: { amount: siCajaIva.amount - cajaIvaDiff }
      });
      console.log(`Adjusted CAJA IVA Saldo Inicial by ${-cajaIvaDiff}. New: ${siCajaIva.amount - cajaIvaDiff}`);
    }
  }

  if (chequeDiff !== 0) {
    const siCheque = await prisma.treasuryTransaction.findFirst({
      where: { account: 'CHEQUES', category: 'Saldo Inicial' }
    });
    if (siCheque) {
      await prisma.treasuryTransaction.update({
        where: { id: siCheque.id },
        data: { amount: siCheque.amount - chequeDiff }
      });
      console.log(`Adjusted CHEQUES Saldo Inicial by ${-chequeDiff}. New: ${siCheque.amount - chequeDiff}`);
    } else if (chequeDiff > 0) {
      // If no Saldo Inicial for CHEQUES but we have diff, we create an offset
      await prisma.treasuryTransaction.create({
        data: {
          date: new Date('2026-09-02T12:00:00Z'),
          amount: -chequeDiff,
          type: 'EXPENSE',
          account: 'CHEQUES',
          category: 'Ajuste',
          description: 'Ajuste para mantener saldo'
        }
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
