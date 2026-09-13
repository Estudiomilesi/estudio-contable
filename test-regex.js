const text = `
Fecha de Emisión:
ORIGINAL
MILESI FEDERICO NILO
Bv.Belgrano 123 - Alvarez, Santa Fe
Período Facturado Desde: Hasta: Fecha de Vto. para el pago:
CUIT:
Condición de venta:
Condición frente al IVA:
Apellido y Nombre / Razón Social:
Domicilio Comercial:
31/08/2025 31/08/2025 01/09/2025
31/08/2025
20316100660
20337704442 BUDASSI FRANCO ALBERTO
24 De Diciembre 135 - Coronel Rodolfo S. Dominguez, Santa
Fe
Otra
CUIT:
Ingresos Brutos:
Fecha de Inicio de Actividades:
Punto de Venta: 00002 Comp. Nro: 00000644
Domicilio Comercial:
Razón Social:
MILESI FEDERICO NILO
Condición frente al IVA:
A FACTURA
COD. 01
`;

console.log('PV:', text.match(/Punto\s+de\s+Venta[^\d]*(\d{4,5})/i)?.[1]);
console.log('NRO:', text.match(/Comp[^\d]*Nro[^\d]*(\d{8})/i)?.[1]);
console.log('DATE:', text.match(/Fecha\s+de\s+Emisi[oó]n[^\d]*(\d{2}\/\d{2}\/\d{4})/i)?.[1]);
const allCuits = [...text.matchAll(/\b(20|23|24|27|30|33|34)-?(\d{8})-?(\d{1})\b/g)];
const uniqueCuits = Array.from(new Set(allCuits.map(m => m[0].replace(/-/g, ''))));
console.log('DATE2:', text.match(/Fecha\s+de\s+Emisi[oó]n[\s\S]{1,300}?(\d{2}\/\d{2}\/\d{4})/i)?.[1]);
