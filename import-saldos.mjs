import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const nameToCodeMap = {
  "MEDICINA MARTIN": "271",
  "RUBEN DARIO PIERUCCI": "220",
  "PAPEL PACK ENVASES S.R.L": "222",
  "RATCLIFFE DAMIAN": "255",
  "JUAN ANDRES SALUSO": "170",
  "LISTRI PABLO JUAN": "189",
  "JUAN IGNACIO GOMEZ": "316",
  "DIGIACOMO EVELYN": "253",
  "GASPARI ALEJANDRO": "309",
  "MARCELO MARTIN CAVALLINI": "320",
  "FERRITODO S. R. L.": "317",
  "EMANUEL CAPPELLONE": "278",
  "PABLO GERARDO GARAU": "331",
  "GIACOMELLI MARIA CRISTINA": "100",
  "GANADERA ROBEL S. R. L.": "282",
  "ALAN FABIAN BRACONI": "350",
  "CONSUMIDOR FINAL": "999",
  "CARLOS MARTIN GRAMACCIONI": "275",
  "SALINAS EDUARDO": "312",
  "DOMINGO ANTONIO GUSIC": "335",
  "NESTOR HUGO ZARATE": "120",
  "PAULO ALEJANDRO ROSSI": "346",
  "LUCAS BARTOLINI": "277",
  "ZITO HIJOS SRL": "264",
  "GASPARI GRACIELA": "248",
  "NICOLAS MARTIN MINO": "351",
  "ACOSTA CESAR": "262",
  "POOL AGROINDUSTRIAL DEL PARANA SA": "229",
  "MARTINENGO VERONICA": "359",
  "RENZONE VALERIA LILIANA": "289",
  "CARLOS MARIANO CASAS": "268",
  "LUCAS EZEQUIEL ESTOMBA": "180",
  "STAR NET S.A.": "221",
  "PIERUCCI ARIEL": "305",
  "HERMETAL SA": "356",
  "GABRIEL HUGO MIGUEL": "345",
  "LGF COMPANIA FINANCIERA SRL": "178",
  "PENTAGRO SA": "219",
  "BELCOR COMMIDITIES ARGENTINA S A": "263",
  "METALBEL S.A.": "301",
  "GASPE S.R.L.": "288",
  "LE GURIE SA": "22",
  "COOPERATIVA AGROPECUARIA DE ALVAREZ": "31",
  "AIFIT S.A.S.": "284",
  "COOPERATIVA DE AGUA POTABLE Y OTROS SERVICIOS PUBLICOS DE ALVAREZ LTDA": "31",
  "COMUNA DE PINERO": "342"
};

function parseCurrency(str) {
  // "$ 3.992,24" -> "3992.24"
  if (!str) return 0;
  return parseFloat(str.replace(/\$ /g, '').replace(/\./g, '').replace(/,/g, '.'));
}

async function main() {
  const fileContent = fs.readFileSync('../saldos.csv', 'utf8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    from_line: 2 // Skip the first line which is "TF. APP | ..."
  });

  const dbClients = await prisma.client.findMany();
  
  // Create maps
  const clientByNameMap = new Map();
  const clientByCodeMap = new Map();
  
  dbClients.forEach(c => {
    clientByNameMap.set(c.name.trim().toLowerCase(), c);
    clientByCodeMap.set(c.code.trim(), c);
  });

  const newlyCreatedClients = [];
  const transactionsToCreate = [];

  for (const record of records) {
    const rawName = record['Cliente'].trim();
    const searchName = rawName.toLowerCase();
    
    let dbClient = null;

    // Check if it's in the hardcoded user map
    if (nameToCodeMap[rawName]) {
      const targetCode = nameToCodeMap[rawName];
      dbClient = clientByCodeMap.get(targetCode);
      
      // If code doesn't exist, we must create it!
      if (!dbClient) {
        dbClient = await prisma.client.create({
          data: {
            code: targetCode,
            name: rawName,
            email: '',
            professionalLabel: 'F', // Default
            currentFee: 0,
            isActive: true
          }
        });
        clientByCodeMap.set(targetCode, dbClient);
        newlyCreatedClients.push(dbClient);
      }
    } else {
      // Regular search
      dbClient = clientByNameMap.get(searchName);
      if (!dbClient) {
        for (const [key, c] of clientByNameMap.entries()) {
          if (key.includes(searchName) || searchName.includes(key)) {
            dbClient = c;
            break;
          }
        }
      }
    }

    if (dbClient) {
      const keys = Object.keys(record);
      const dateStr = record[keys[1]];
      const [day, month, year] = dateStr.split('/');
      const date = new Date(`${year}-${month}-${day}T12:00:00.000Z`);
      
      const amount = parseCurrency(record[keys[3]]);
      
      if (amount > 0) {
        transactionsToCreate.push({
          clientId: dbClient.id,
          date,
          type: 'CHARGE',
          amount,
          description: record[keys[2]].trim()
        });
      }
    }
  }

  // Insert transactions
  let insertedCount = 0;
  for (const tx of transactionsToCreate) {
    await prisma.accountTransaction.create({ data: tx });
    insertedCount++;
  }

  console.log(`\n============================`);
  console.log(`CLIENTES DADOS DE ALTA AUTOMATICAMENTE: ${newlyCreatedClients.length}`);
  newlyCreatedClients.forEach(c => console.log(`- ${c.name} (Cód: ${c.code})`));
  console.log(`\nCOMPROBANTES ADEUDADOS IMPORTADOS: ${insertedCount}`);
  console.log(`============================\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
