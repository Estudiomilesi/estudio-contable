const fs = require('fs');
const crypto = require('crypto');

const csv = `
"3","AIFIT S. A. S.","","CUIT","30718955625","gerenciaaifit@gmail.com,admaifitarg@gmail.com,corinacicconi@hotmail.com","","PASAJE LUCIA MIRANDA 3283,ROSARIO SUD (CP: 2000)","SANTA FE","PASAJE LUCIA MIRANDA 3283,ROSARIO SUD (CP: 2000)","Responsable Inscripto","Contado","","","","SI","SI","15","3","Estudio Cori","federico@estudiomilesi.com","","","$ 0,00","","02/06/2026 17:31","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI5208452","PABLO MARTIN D AMBROSIO","AMANESUR ARGENTINA S.R.L.","CUIT","20258402287","amanesurcomex@gmail.com,guillermomanuelacosta@gmail.com,corinacicconi@hotmail.com","","RUTA PROVINCIAL N21, KM 7 109 Dpto:LOTE,ALVEAR (CP: 2126)","SANTA FE","RUTA PROVINCIAL N21, KM 7 109 Dpto:LOTE,ALVEAR (CP: 2126)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","17/09/2026 12:17","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI4845174","MATIAS BARBERA","BARBERA MUEBLES Y MESADAS S.R.L.","CUIT","23284723309","Barberamueblesymesadas@gmail.com,corinacicconi@hotmail.com","","BV. BELGRANO 125,ALVAREZ (CP: 2107)","SANTA FE","BV. BELGRANO 125,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 50.000,00","","27/07/2026 17:16","","NO","201","SIN MICROSITIO","3402528411","ACTIVO","NO"
"CLI4967826","MARCELA ANDREA CAULA","BENCALUMA S.R.L.","CUIT","27209667342","corinacicconi@hotmail.com,marcelacaula@yahoo.com","","SARMIENTO 114,CORONEL ARNOLD (CP: 2123)","SANTA FE","SARMIENTO 114,CORONEL ARNOLD (CP: 2123)","Consumidor Final","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","14/08/2026 12:38","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI4858383","LUCIANO ROQUE CHINELLATO","CARBAU S.R.L.","CUIT","20226481460","consultas@hermetal-sa.com.ar,corinacicconi@hotmail.com","","27 DE FEBRERO 660,PUEBLO ESTHER (CP: 2126)","SANTA FE","27 DE FEBRERO 660,PUEBLO ESTHER (CP: 2126)","Consumidor Final","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","29/07/2026 14:35","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI4832491","SANTIAGO EDUARDO POCHETTINO","COMMANDERS S.A.S.","CUIT","20256486599","santiago@gruposurexport.com.ar,poolagroros@gmail.com,corinacicconi@hotmail.com","","CASILDA 7671,ROSARIO NORTE (CP: 2000)","SANTA FE","CASILDA 7671,ROSARIO NORTE (CP: 2000)","Monotributo","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ -700.000,00","","24/07/2026 16:31","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI4912191","CONSUMIDOR FINAL","","Otro","1","daragallardo40@gmail.com,corinacicconi@hotmail.com","","No especificado","-","No especificado","Consumidor Final","Contado","","","","SI","NO","","","Corina Cicconi","corinapaolacicconi@gmail.com","","","$ 20.000,00","","04/08/2026 17:25","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"","CONSUMIDOR FINAL","","Otro","1","alma@estudiomilesi.com","","No especificado","-","No especificado","Consumidor Final","Contado","","","","NO","NO","","","Corina Cicconi","corinapaolacicconi@gmail.com","","","$ 0,00","","16/07/2026 16:01","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"99","Consumidor Final","","Otro","1","","","-","-","-","Consumidor Final","Contado","","","","NO","NO","","","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","02/06/2026 17:07","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI4999144","ONE FIT S. R. L.","CRISTIAN ANDRES RAMOS GUTIERREZ","CUIT","33717874469","gerenciaaifit@gmail.com,alma@estudiomilesi.com,corinacicconi@hotmail.com","","PASAJE LUCIA MIRANDA 3283,ROSARIO SUD (CP: 2000)","SANTA FE","PASAJE LUCIA MIRANDA 3283,ROSARIO SUD (CP: 2000)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 280.000,00","","20/08/2026 14:03","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI4999158","ULISES RICARDO MUÑOZ","DUESPONDE S.A.","CUIT","20281463501","ulrm@hotmail.com,alma@estudiomilesi.com,corinacicconi@hotmail.com","","ARTURO ILLIA 1515 S:B,FUNES (CP: 2132)","SANTA FE","ARTURO ILLIA 1515 S:B,FUNES (CP: 2132)","Monotributo","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 280.000,00","","20/08/2026 14:05","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"07","ALVAREZ CARTON SOCIEDAD ANONIMA","FEDE VALENTINI","CUIT","30556329644","corinacicconi@hotmail.com,flia.valentini@hotmail.com,PRESUPUESTOS@oscarimpresos.com","","SAN LORENZO 325,ALVAREZ (CP: 2107)","SANTA FE","SAN LORENZO 325,ALVAREZ (CP: 2107)","Consumidor Final","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","01/07/2026 14:03","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"","FONTAGRO SRL","FONTAGRO SRL","CUIT","30716832518","fontagrosrl@gmail.com,corinacicconi@hotmail.com","","BV. SAN MARTIN 147,ALVAREZ (CP: 2107)","SANTA FE","BV. SAN MARTIN 147,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","17/07/2026 16:25","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"5","GUSTAVO OSVALDO FONTANELLA","GUSTAVO OSVALDO FONTANELLA","CUIT","20223474749","corinacicconi@hotmail.com","","SAN MARTIN 331,ALVAREZ (CP: 2107)","SANTA FE","SAN MARTIN 331,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","10","6","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","11/06/2026 15:35","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"2107","LA MU SAS","JUAN BENEDETTO","CUIT","30716556790","corinacicconi@hotmail.com,transportebenedetto@hotmail.com","","LAS HERAS 962,ALVAREZ (CP: 2107)","SANTA FE","LAS HERAS 962,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","10","6","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","09/06/2026 16:17","","NO","201","SIN MICROSITIO","3402528411","ACTIVO","NO"
"CLI4926634","METALBEL S. A.","LORENA MARQUEZ","CUIT","30718749693","corinacicconi@hotmail.com,vquinteros@grupogem.com.ar","","SARMIENTO Y SUIPACHA 0,ALVAREZ (CP: 2107)","SANTA FE","SARMIENTO Y SUIPACHA 0,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","06/08/2026 16:19","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI5129540","PABLO SANCHEZ","LUPA FABRICANTES S.R.L.","CUIT","20403587037","pablosanchez6240@gmail.com,lucas.sanchez3840@gmail.com,corinacicconi@hotmail.com","","PIACENZA 230,ALVAREZ (CP: 2107)","SANTA FE","PIACENZA 230,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","07/09/2026 15:33","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"","MARCELO MARTIN CAVALLINI","MARCELO MARTIN CAVALLINI","CUIT","20277863171","alma@estudiomilesi.com,corinacicconi@hotmail.com","","GRAL PAZ 811,ALVAREZ (CP: 2107)","SANTA FE","GRAL PAZ 811,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","16/07/2026 16:43","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"","MARCOS BARTOLINI","MARCOS BARTOLINI","CUIT","20327585445","alma@estudiomilesi.com,corinacicconi@hotmail.com","","MORENO 867,ALVAREZ (CP: 2107)","SANTA FE","MORENO 867,ALVAREZ (CP: 2107)","Monotributo","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","16/07/2026 16:45","","NO","201","SIN MICROSITIO","3402528411","ACTIVO","NO"
"1","BELGRAINS  SA","Nueva Sociedad","CUIT","33707263089","gmalvestiti@grupogem.com.ar,corinacicconi@hotmail.com","","SARMIENTO Y SUIPACHA 0,ALVAREZ (CP: 2107)","SANTA FE","SARMIENTO Y SUIPACHA 0,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","15","3","Estudio Cori","federico@estudiomilesi.com","","","$ 0,00","","02/06/2026 17:28","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"08","FEDERICO JESUS VALENTINI","OSCAR IMPRESOS","CUIT","20272928585","CORINACICCONI@HOTMAIL.COM,PRESUPUESTOS@oscarimpresos.com,admin@oscarimpresos.com","","SARMIENTO 3475,ZAVALLA (CP: 2123)","SANTA FE","SARMIENTO 3475,ZAVALLA (CP: 2123)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","01/07/2026 14:06","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"6","PAPEL PACK ENVASES S.R.L","PAPEL PACK","CUIT","30711623368","corinacicconi@hotmail.com,ADMINISTRACION@PAPELPACKENVASES.COM","","ARENALES 336,ALVAREZ (CP: 2107)","SANTA FE","ARENALES 336,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","10","6","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","17/06/2026 10:23","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI4967880","PABLO EXEQUIEL SCHENONE","PYL AGRO TRANSPORTE S.A.S.","CUIT","20293830518","pabloschenone@hotmail.com,corinacicconi@hotmail.com","","5 DE JULIO 1070,MAXIMO PAZ (CP: 2115)","SANTA FE","5 DE JULIO 1070,MAXIMO PAZ (CP: 2115)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","14/08/2026 12:53","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"","SANTIAGO FABIAN VILLAVERDE","SANTIAGO FABIAN VILLAVERDE","CUIT","20322124393","loshermanosvilla3@gmail.com,corinacicconi@hotmail.com","","TUCUMAN 1095,ALVAREZ (CP: 2107)","SANTA FE","TUCUMAN 1095,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 0,00","","14/07/2026 17:56","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"CLI4926864","POOL AGROINDUSTRIAL DEL PARANA SA","SANTIAGO POCHETTINO","CUIT","30716997851","poolagroros@gmail.com,santiago@gruposurexport.com.ar,corinacicconi@hotmail.com","","PUEYRREDON 322 Piso:PB Dpto:A,ROSARIO NORTE (CP: 2000)","SANTA FE","PUEYRREDON 322 Piso:PB Dpto:A,ROSARIO NORTE (CP: 2000)","Responsable Inscripto","Contado","","","","SI","SI","10","7","Corina Cicconi, Estudio Cori","corinapaolacicconi@gmail.com, federico@estudiomilesi.com","","","$ 1.000.000,00","","06/08/2026 16:42","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
"2","TIERRA PARANA CEREALES SRL","","CUIT","30715237225","pcordoba@grupogem.com.ar,CORINACICCONI@HOTMAIL.COM","","BV SAN MARTIN 147 Piso:0 Dpto:0 S:0 T:0 M:0,ALVAREZ (CP: 2107)","SANTA FE","BV SAN MARTIN 147 Piso:0 Dpto:0 S:0 T:0 M:0,ALVAREZ (CP: 2107)","Responsable Inscripto","Contado","","","","SI","SI","15","3","Estudio Cori","federico@estudiomilesi.com","","","$ 0,00","","02/06/2026 17:30","","NO","201","SIN MICROSITIO","","ACTIVO","NO"
`;

function parseCSVLine(line) {
  const parts = [];
  let inQuotes = false;
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      parts.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  parts.push(cur);
  return parts;
}

const lines = csv.trim().split('\n');
let sql = '';
const codes = new Set();
for (const line of lines) {
  if (!line.trim()) continue;
  const parts = parseCSVLine(line);
  
  let internalCode = parts[0];
  let name = parts[1].replace(/'/g, "''");
  let fantasy = parts[2] ? parts[2].replace(/'/g, "''") : null;
  if (fantasy && fantasy !== name) {
      name = name + ' (' + fantasy + ')';
  }

  let cuit = parts[4];
  let emailStr = parts[5];
  let email = 'sin@email.com';
  if (emailStr) {
    email = emailStr.split(',')[0].trim();
  }
  
  let cellphone = parts[6] ? parts[6].replace(/'/g, "''") : null;
  let address = parts[7] ? parts[7].replace(/'/g, "''") : null;
  
  let taxStr = parts[10] || '';
  let taxCond = 'Consumidor Final';
  if (taxStr.includes('Responsable Inscripto')) taxCond = 'Responsable Inscripto';
  if (taxStr.includes('Monotributo')) taxCond = 'Monotributo';
  if (taxStr.includes('Exento')) taxCond = 'Exento';

  let contact = parts[13] ? parts[13].replace(/'/g, "''") : null;

  // Fallback for duplicates in internal code or CUIT
  if (!internalCode || internalCode.trim() === '') {
      internalCode = 'CLI' + Math.floor(Math.random()*10000);
  }
  while (codes.has(internalCode)) {
      internalCode = internalCode + "_" + Math.floor(Math.random()*1000);
  }
  codes.add(internalCode);

  const id = crypto.randomUUID();
  const addressVal = address ? "'" + address + "'" : 'NULL';
  const cuitVal = cuit ? "'" + cuit + "'" : 'NULL';
  const cellphoneVal = cellphone ? "'" + cellphone + "'" : 'NULL';
  const contactVal = contact ? "'" + contact + "'" : 'NULL';

  sql += 'INSERT INTO "Client" ("id", "code", "name", "address", "cuit", "email", "cellphone", "contact", "fiscalCondition", "professionalLabel", "defaultBillingProfile", "currentFee", "hasAbono", "isActive", "createdAt", "updatedAt") VALUES (' + 
         "'" + id + "', " + 
         "'" + internalCode + "', " + 
         "'" + name + "', " + 
         addressVal + ", " + 
         cuitVal + ", " + 
         "'" + email + "', " + 
         cellphoneVal + ", " + 
         contactVal + ", " + 
         "'" + taxCond + "', " + 
         "'F', " + 
         "'NO_FISCAL', 0, false, true, NOW(), NOW());\n";
}

fs.writeFileSync('import_cori.sql', sql);
console.log('done');
