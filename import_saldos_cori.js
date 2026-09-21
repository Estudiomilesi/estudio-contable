const fs = require('fs');
const crypto = require('crypto');

let sql = '';

function addTx(clientSearch, dateStr, amount, receiptNumber, description) {
    const id = crypto.randomUUID();
    sql += `INSERT INTO "AccountTransaction" ("id", "clientId", "date", "type", "billingProfile", "netAmount", "ivaAmount", "amount", "description", "receiptNumber", "isEmailed", "createdAt") 
VALUES (
    '${id}',
    (SELECT id FROM "Client" WHERE name LIKE '%${clientSearch}%' LIMIT 1),
    '${dateStr} 12:00:00',
    'CHARGE',
    'NO_FISCAL',
    ${amount},
    0,
    ${amount},
    '${description}',
    '${receiptNumber}',
    false,
    NOW()
);\n`;
}

// 1. POCHETTINO
addTx('SANTIAGO POCHETTINO', '2026-08-10', 700000, '00002-00000012', 'Saldo Inicial - FACTURA C');
addTx('SANTIAGO POCHETTINO', '2026-08-06', 300000, '00002-00000011', 'Saldo Inicial - FACTURA C');

// 2. DUESPONDE
addTx('DUESPONDE S.A.', '2026-08-20', 280000, '00002-00000024', 'Saldo Inicial - FACTURA NO VALIDA EN AFIP');

// 3. BARBERA
addTx('BARBERA MUEBLES', '2026-07-27', 50000, '00002-00000014', 'Saldo Inicial - FACTURA NO VALIDA EN AFIP');

fs.writeFileSync('import_saldos.sql', sql);
console.log('done');
