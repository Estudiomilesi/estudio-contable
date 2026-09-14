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
console.log([...text.matchAll(/(?<=^|\D)(20|23|24|27|30|33|34)[\s-]*(\d{8})[\s-]*(\d{1})(?=\D|$)/g)].map(m => m[1]+m[2]+m[3]));
