const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const workbook = xlsx.readFile('clientes_extra.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  let updatedCount = 0;

  for (const row of data) {
    let codigo = row['CÃ³digo interno'] || row['Código interno'];
    let nombre = row['Nombre o razÃ³n social'] || row['Nombre o razón social'];
    let cuit = row['Nro. de Documento']?.toString();
    let email = row['E-mail']?.toString();
    let domicilio = row['Domicilio']?.toString();
    let condicion = row['Condicion ante el IVA']?.toString();
    let telefono = row['WhatsApp']?.toString();

    if (!codigo && !nombre) continue;

    // Try finding the client by code or name
    let client = null;
    if (codigo) {
      client = await prisma.client.findUnique({ where: { code: codigo.toString() } });
    }
    if (!client && nombre) {
      client = await prisma.client.findFirst({ where: { name: nombre } });
    }

    if (client) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          cuit: cuit || client.cuit,
          email: email || client.email,
          address: domicilio || client.address,
          fiscalCondition: condicion || client.fiscalCondition,
          cellphone: telefono || client.cellphone,
        }
      });
      updatedCount++;
    }
  }

  console.log(`ActualizaciÃ³n completada. Se enriquecieron ${updatedCount} clientes.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
