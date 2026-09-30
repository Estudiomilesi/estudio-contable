const fs = require('fs');

const file = 'src/app/api/facturacion/procesar/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "Se facturó a ${transacciones.length} clientes y se enviaron ${emailsEnviados} correos electrónicos automáticamente.",
  "¡Proceso completado con éxito!\\n\\nSe generaron ${transacciones.length} comprobantes.\\nSe enviaron ${emailsEnviados} emails automáticamente.\\n\\nPara revisar los comprobantes y enviar los de AFIP pendientes, andá a la pestaña Comprobantes."
);

fs.writeFileSync(file, content);
console.log('Fixed message in procesar/route.ts');
