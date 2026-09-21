INSERT INTO "AccountTransaction" ("id", "clientId", "date", "type", "billingProfile", "netAmount", "ivaAmount", "amount", "description", "receiptNumber", "isEmailed", "createdAt") 
VALUES (
    '0caf9fc7-18b5-4289-98ba-567d783903de',
    (SELECT id FROM "Client" WHERE name LIKE '%SANTIAGO POCHETTINO%' LIMIT 1),
    '2026-08-10 12:00:00',
    'CHARGE',
    'NO_FISCAL',
    700000,
    0,
    700000,
    'Saldo Inicial - FACTURA C',
    '00002-00000012',
    false,
    NOW()
);
INSERT INTO "AccountTransaction" ("id", "clientId", "date", "type", "billingProfile", "netAmount", "ivaAmount", "amount", "description", "receiptNumber", "isEmailed", "createdAt") 
VALUES (
    'f7cf087c-95cb-4d3d-8f3f-4133d2b99d43',
    (SELECT id FROM "Client" WHERE name LIKE '%SANTIAGO POCHETTINO%' LIMIT 1),
    '2026-08-06 12:00:00',
    'CHARGE',
    'NO_FISCAL',
    300000,
    0,
    300000,
    'Saldo Inicial - FACTURA C',
    '00002-00000011',
    false,
    NOW()
);
INSERT INTO "AccountTransaction" ("id", "clientId", "date", "type", "billingProfile", "netAmount", "ivaAmount", "amount", "description", "receiptNumber", "isEmailed", "createdAt") 
VALUES (
    'a8215736-dbcb-471e-9fa1-9a381128c109',
    (SELECT id FROM "Client" WHERE name LIKE '%DUESPONDE S.A.%' LIMIT 1),
    '2026-08-20 12:00:00',
    'CHARGE',
    'NO_FISCAL',
    280000,
    0,
    280000,
    'Saldo Inicial - FACTURA NO VALIDA EN AFIP',
    '00002-00000024',
    false,
    NOW()
);
INSERT INTO "AccountTransaction" ("id", "clientId", "date", "type", "billingProfile", "netAmount", "ivaAmount", "amount", "description", "receiptNumber", "isEmailed", "createdAt") 
VALUES (
    'a30e5199-59b1-48c4-9fbe-5d157ac71194',
    (SELECT id FROM "Client" WHERE name LIKE '%BARBERA MUEBLES%' LIMIT 1),
    '2026-07-27 12:00:00',
    'CHARGE',
    'NO_FISCAL',
    50000,
    0,
    50000,
    'Saldo Inicial - FACTURA NO VALIDA EN AFIP',
    '00002-00000014',
    false,
    NOW()
);
