const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rawText = `
# 00001322	02/09/2026	CLIENTES	FRANCO ALBERTO BUDASSI	Banco Fede	 219.615,00 	181.500 Honorarios 38.115 IVA
# 00001321	02/09/2026	CLIENTES	MALVESTITI PAOLA	Banco Juanma	 13.500,00 	
# 00001320	02/09/2026	CLIENTES	AGAS SRL	Banco Juanma	 811.625,34 	
# 00001319	02/09/2026	CLIENTES	MAIDANA HUGO	Efectivo	 38.000,00 	
# 00000890	02/09/2026	Sueldos	Sueldos Rosario	Efectivo	-2.053.835,55 	Leyenda: sueldo lucho
# 00000889	02/09/2026	Gastos Rosario	Alquiler	Efectivo	-229.625,00 	Leyenda: La Maquinita
# 00001318	02/09/2026	CLIENTES	AYESTARAN GUILLERMO	Efectivo	 40.000,00 	
# 00001317	02/09/2026	CLIENTES	PIERUCCI DAMIAN	Banco Fede	 34.500,00 	
# 00001316	02/09/2026	CLIENTES	BELTRAME RICARDO	Banco Fede	 24.000,00 	
# 00001315	02/09/2026	CLIENTES	ELVIA NATALI FERREYRA	Banco Fede	 27.500,00 	
# 00001314	02/09/2026	CLIENTES	JORGE LUIS HUIDOBRO ORELLANA	Banco Fede	 27.500,00 	
# 00001313	02/09/2026	Retiros Socio	Retiro Fede	Efectivo	 311,39 	Leyenda: AJUSTE
# 00000876	01/09/2026	Sueldos	Sueldos Alvarez	Efectivo	-1.737.500,00 	Leyenda: SUELDO NOE
# 00000875	01/09/2026	Sueldos	Sueldos Alvarez	Banco Juanma	-575.413,46 	Leyenda: SUELDO JULI
# 00000874	01/09/2026	Sueldos	Sueldos Alvarez	Efectivo	-570.000,00 	Leyenda: SUELDO ALMA
# 00000873	01/09/2026	Sueldos	Sueldos Alvarez	Efectivo	-700.000,00 	Leyenda: SUELDO BELEN
# 00000872	01/09/2026	Sueldos	Sueldos Alvarez	Banco Juanma	-500.000,00 	Leyenda: SUELDO PAULA
# 00000872	01/09/2026	Sueldos	Sueldos Alvarez	Efectivo	-705.000,00 	Leyenda: SUELDO PAULA
# 00000871	01/09/2026	Sueldos	Sueldos Alvarez	Banco Juanma	-700.000,00 	Leyenda: SUELDO LUICHI
# 00000871	01/09/2026	Sueldos	Sueldos Alvarez	Efectivo	-1.040.000,00 	Leyenda: SUELDO LUICHI
# 00001308	01/09/2026	CLIENTES	FONTAGRO	Efectivo	 375.000,00 	
# 00001307	01/09/2026	CLIENTES	TIERRA PARANA CEREALES SRL	Efectivo	 515.000,00 	
# 00001306	01/09/2026	CLIENTES	DISTRIBUIDORA F&G SRL	Banco Fede	 127.000,00 	
# 00001305	01/09/2026	CLIENTES	NENCIONI ALEJO	Banco Fede	 123.000,00 	
# 00001304	01/09/2026	CLIENTES	PETRELLI FERNANDO	Banco Fede	 180.000,00 	
# 00001303	01/09/2026	CLIENTES	NENCIONI GUSTAVO	Banco Fede	 170.000,00 	
# 00001302	01/09/2026	CLIENTES	AYESTARAN IGNACIO	Banco Fede	 35.000,00 	
# 00001301	01/09/2026	CLIENTES	CAMPOS AGUSTINA	Banco Fede	 60.000,00 	
# 00001300	01/09/2026	CLIENTES	MATIAS STIPICH	Banco Fede	 24.000,00 	
# 00001300	01/09/2026	PASE DE CAJAS	A CAJA IVA	Cheque	-2.855.000,00 	pase de cheque a caja iva
# 00001294	01/09/2026	CLIENTES	CARNEVALI ROMAN DAVID	Cheque	 2.855.000,00 	
# 00001293	01/09/2026	CLIENTES	EDUARDO MIGUEL HANSEN	Banco Fede	 644.325,00 	532.500 honorarios, 111.825 IVA
# 00001292	01/09/2026	CLIENTES	LUCHETTI NESTOR	Efectivo	 34.000,00 	
# 00001291	01/09/2026	CLIENTES	TIERRA PARANA CEREALES SRL	Efectivo	 515.000,00 	
# 00001290	01/09/2026	CLIENTES	CORREA ALDANA	Banco Juanma	 14.500,00 	
# 00001289	01/09/2026	CLIENTES	ANDRES GERARDO LAMBOY	Banco Juanma	 66.000,00 	
`;

function parseAmount(str) {
  return parseFloat(str.trim().replace(/\./g, '').replace(',', '.'));
}

async function findClientBestMatch(clients, name) {
  // Try exact match in db name
  let matches = clients.filter(c => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    // exact exact?
    const exact = matches.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (exact) return exact;
    return matches[0]; // fallback
  }

  // Fallback to words
  const words = name.split(' ');
  for (const w of words) {
    if (w.length > 4) {
      const matchWord = clients.find(c => c.name.toLowerCase().includes(w.toLowerCase()));
      if (matchWord) return matchWord;
    }
  }
  return null;
}

async function main() {
  const lines = rawText.trim().split('\n');
  const clients = await prisma.client.findMany();
  const employees = await prisma.employee.findMany();

  let cajaDiff = 0;
  let cajaIvaDiff = 0;
  let chequeDiff = 0;

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 6) continue;

    const nro = parts[0].trim();
    const fecha = parts[1].trim(); // 02/09/2026 -> 2026-09-02T12:00:00Z
    const cp = parts[2].trim();
    const cs = parts[3].trim();
    const tes = parts[4].trim(); // Banco Fede, Banco Juanma, Efectivo, Cheque
    const importeStr = parts[5].trim();
    const info = parts[6] ? parts[6].trim() : '';

    const dateStr = `2026-${fecha.substring(3,5)}-${fecha.substring(0,2)}T12:00:00Z`;
    const amount = parseAmount(importeStr);

    let account = 'CAJA';
    if (tes === 'Banco Fede') account = 'BANCOS FEDE';
    if (tes === 'Banco Juanma') account = 'BANCOS JUANMA';
    if (tes === 'Cheque') account = 'CHEQUES';

    const type = amount >= 0 ? 'INCOME' : 'EXPENSE';

    let category = 'Varios';
    let clientId = null;
    let employeeId = null;

    if (cp === 'CLIENTES') {
      category = 'Honorarios';
      // Specific overrides based on user
      let searchName = cs;
      if (searchName === 'FRANCO ALBERTO BUDASSI') searchName = 'BUDASSI';
      if (searchName === 'MALVESTITI PAOLA') searchName = 'MALVESTITI';
      if (searchName === 'AGAS SRL') searchName = 'AGAS';
      if (searchName === 'PIERUCCI DAMIAN') searchName = 'PIERUCCI DAMIAN';
      if (searchName === 'ELVIA NATALI FERREYRA') searchName = 'ELVIA';
      if (searchName === 'JORGE LUIS HUIDOBRO ORELLANA') searchName = 'HUIDOBRO';
      if (searchName === 'FONTAGRO') searchName = 'FONTAGRO';
      if (searchName === 'DISTRIBUIDORA F&G SRL') searchName = 'DISTRIBUIDORA F'; // F&G instead of J&G
      if (searchName === 'NENCIONI ALEJO') searchName = 'NENCIONI ALEJO';
      if (searchName === 'NENCIONI GUSTAVO') searchName = 'NENCIONI GUSTAVO';
      if (searchName === 'CARNEVALI ROMAN DAVID') searchName = 'CARNEVALI';
      if (searchName === 'EDUARDO MIGUEL HANSEN') searchName = 'HANSEN';
      if (searchName === 'ANDRES GERARDO LAMBOY') searchName = 'LAMBOY';
      if (searchName === 'MATIAS STIPICH') searchName = 'STIPICH';

      const matchedClient = await findClientBestMatch(clients, searchName);
      if (matchedClient) clientId = matchedClient.id;
      else console.log('COULD NOT MATCH CLIENT:', cs);
    } 
    else if (cp === 'Sueldos') {
      category = 'Sueldos';
      const empNameMatch = info.match(/sueldo\s+([a-zA-Z]+)/i);
      if (empNameMatch) {
        const empName = empNameMatch[1];
        let found = employees.find(e => e.name.toLowerCase() === empName.toLowerCase());
        if (!found && empName.toLowerCase() === 'belen') found = employees.find(e => e.name.toLowerCase().includes('bel'));
        if (found) employeeId = found.id;
        else console.log('COULD NOT MATCH EMPLOYEE:', empName);
      }
    }
    else if (cp === 'Gastos Rosario') {
      category = 'Gastos Generales';
    }
    else if (cp === 'Retiros Socio') {
      category = 'Retiro Fede'; // The list says Retiro Fede
    }
    else if (cp === 'PASE DE CAJAS') {
      category = 'Pase de Caja';
    }

    // CREATE TREASURY TRANSACTION
    const treasuryPayload = {
      date: new Date(dateStr),
      amount: amount,
      type: type,
      account: account,
      category: category,
      description: info || 'Migración inicial',
      clientId: clientId,
      employeeId: employeeId
    };

    if (cp === 'PASE DE CAJAS') {
      // 1. Withdrawal from Cheques
      await prisma.treasuryTransaction.create({ data: { ...treasuryPayload, type: 'TRANSFER', description: 'Pase a CAJA IVA' } });
      // 2. Deposit to CAJA IVA
      await prisma.treasuryTransaction.create({ data: { ...treasuryPayload, account: 'CAJA IVA', amount: Math.abs(amount), type: 'TRANSFER', description: 'Ingreso desde Cheques' } });
      chequeDiff += amount; // -2855000
      cajaIvaDiff += Math.abs(amount); // +2855000
      console.log('Created PASE DE CAJAS');
    } else {
      await prisma.treasuryTransaction.create({ data: treasuryPayload });
      console.log('Created ' + category + ' ' + account + ' ' + amount);

      // AUTO WITHDRAWALS FOR BANKS
      if (account === 'BANCOS FEDE' || account === 'BANCOS JUANMA') {
        const retiroCat = account === 'BANCOS FEDE' ? 'Retiro Fede' : 'Retiro Juanma';
        
        if (type === 'INCOME') {
          // Check for IVA split (Budassi and Hansen)
          if (info.includes('IVA') && info.includes('Honorarios')) {
            // Extract the net and IVA from text: e.g. "181.500 Honorarios 38.115 IVA"
            const match = info.match(/([0-9\.]+)\s+[Hh]onorarios.*?([0-9\.]+)\s+IVA/);
            if (match) {
              const neto = parseAmount(match[1]);
              const iva = parseAmount(match[2]);
              await prisma.treasuryTransaction.create({
                data: { date: new Date(dateStr), amount: -neto, type: 'EXPENSE', account: account, category: retiroCat, description: 'Retiro automático s/ cobro', clientId }
              });
              await prisma.treasuryTransaction.create({
                data: { date: new Date(dateStr), amount: -iva, type: 'EXPENSE', account: account, category: retiroCat, description: 'Retiro automático IVA s/ cobro', clientId }
              });
            } else {
              await prisma.treasuryTransaction.create({
                data: { date: new Date(dateStr), amount: -Math.abs(amount), type: 'EXPENSE', account: account, category: retiroCat, description: 'Retiro automático s/ cobro', clientId }
              });
            }
          } else {
            await prisma.treasuryTransaction.create({
              data: { date: new Date(dateStr), amount: -Math.abs(amount), type: 'EXPENSE', account: account, category: retiroCat, description: 'Retiro automático s/ cobro', clientId }
            });
          }
        } else if (type === 'EXPENSE') {
          await prisma.treasuryTransaction.create({
            data: { date: new Date(dateStr), amount: Math.abs(amount), type: 'INCOME', account: account, category: retiroCat, description: 'Reintegro automático por pago de gasto', clientId, employeeId }
          });
        }
      } else {
        // Accumulate diffs for CAJA and CHEQUES
        if (account === 'CAJA' || account === 'Efectivo') cajaDiff += amount;
        if (account === 'CHEQUES') chequeDiff += amount;
        if (account === 'CAJA IVA') cajaIvaDiff += amount;
      }
      
      // ACCOUNTS TRANSACTION (Only for Honorarios/Clientes)
      if (category === 'Honorarios' && clientId) {
        let neto = amount;
        let iva = 0;
        
        if (info.includes('IVA') && info.includes('Honorarios')) {
          const match = info.match(/([0-9\.]+)\s+[Hh]onorarios.*?([0-9\.]+)\s+IVA/);
          if (match) {
            neto = parseAmount(match[1]);
            iva = parseAmount(match[2]);
          }
        }

        const charge = await prisma.accountTransaction.create({
          data: { clientId, date: new Date(dateStr), type: 'CHARGE', billingProfile: 'NO_FISCAL', netAmount: neto, ivaAmount: iva, amount: amount, description: 'Saldo inicial (Migración)' }
        });

        const payment = await prisma.accountTransaction.create({
          data: { clientId, date: new Date(dateStr), type: 'PAYMENT', billingProfile: 'NO_FISCAL', netAmount: neto, ivaAmount: iva, amount: amount, description: 'Cobro (Migración)' }
        });

        await prisma.paymentApplication.create({ data: { chargeId: charge.id, paymentId: payment.id, amount: amount } });
      }
    }
  }

  // Adjust Saldos Iniciales
  if (cajaDiff !== 0) {
    const siCaja = await prisma.treasuryTransaction.findFirst({ where: { account: 'CAJA', category: 'Saldo Inicial' } });
    if (siCaja) {
      await prisma.treasuryTransaction.update({ where: { id: siCaja.id }, data: { amount: siCaja.amount - cajaDiff } });
      console.log('Adjusted CAJA by ' + (-cajaDiff));
    }
  }

  if (cajaIvaDiff !== 0) {
    const siCajaIva = await prisma.treasuryTransaction.findFirst({ where: { account: 'CAJA IVA', category: 'Saldo Inicial' } });
    if (siCajaIva) {
      await prisma.treasuryTransaction.update({ where: { id: siCajaIva.id }, data: { amount: siCajaIva.amount - cajaIvaDiff } });
      console.log('Adjusted CAJA IVA by ' + (-cajaIvaDiff));
    }
  }

  if (chequeDiff !== 0) {
    const siCheque = await prisma.treasuryTransaction.findFirst({ where: { account: 'CHEQUES', category: 'Saldo Inicial' } });
    if (siCheque) {
      await prisma.treasuryTransaction.update({ where: { id: siCheque.id }, data: { amount: siCheque.amount - chequeDiff } });
      console.log('Adjusted CHEQUES by ' + (-chequeDiff));
    } else {
      await prisma.treasuryTransaction.create({
        data: { date: new Date('2026-09-02T12:00:00Z'), amount: -chequeDiff, type: 'EXPENSE', account: 'CHEQUES', category: 'Ajuste', description: 'Ajuste para mantener saldo' }
      });
      console.log('Created CHEQUE Adjustment for ' + (-chequeDiff));
    }
  }

  console.log('IMPORT COMPLETE.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
