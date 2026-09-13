import { NextResponse } from 'next/server';
const pdfParse = require('pdf-parse');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se enviaron archivos PDF' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;

      // ---- Parsing Regex ----
      
      const codeMatch = text.match(/(?:COD|C\u00F3digo Nro|Codigo Nro)[.\s:]*0*(\d{1,3})/i);
      const compCode = codeMatch ? parseInt(codeMatch[1]) : 0;
      
      let isNotaCredito = false;
      let typeDesc = "Factura";
      if ([3, 8, 13, 102, 103].includes(compCode)) {
        isNotaCredito = true;
        typeDesc = "Nota de Crédito";
      } else if (text.toLowerCase().includes('nota de cr')) {
        isNotaCredito = true;
        typeDesc = "Nota de Crédito";
      }
      
      // 2. Receipt Number
      // "Punto de Venta: 00001 Comp. Nro: 00000123"
      const pvMatch = text.match(/Punto de Venta:\s*(\d{4,5})/i);
      const nroMatch = text.match(/Comp\. Nro:\s*(\d{8})/i);
      const pv = pvMatch ? pvMatch[1] : '0000';
      const nro = nroMatch ? nroMatch[1] : '00000000';
      
      // 3. Date
      // "Fecha de Emisión: 15/09/2026"
      const dateMatch = text.match(/Fecha de Emisi[o\u00F3]n:\s*(\d{2}\/\d{2}\/\d{4})/i);
      let dateIso = new Date().toISOString();
      if (dateMatch) {
        const parts = dateMatch[1].split('/');
        dateIso = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).toISOString();
      }

      // 4. CUIT/DNI Receptor
      // "CUIT / CUIL / DNI: 30-70000000-1" or "CUIT: 30700000001"
      // We look for the SECOND CUIT usually, because the first is the issuer.
      // Or we specifically look for the receptor label.
      const receptorBlockMatch = text.match(/(?:CUIT\s*\/\s*CUIL\s*\/\s*DNI|CUIT\s*\/\s*CUIL\s*\/\s*CDI)\s*[:]\s*(\d{2}-?\d{8}-?\d{1}|\d{7,11})/i);
      let receptorCuit = '';
      if (receptorBlockMatch) {
        receptorCuit = receptorBlockMatch[1].replace(/-/g, '');
      } else {
        // Fallback: get all CUITs and take the last one (assuming issuer is at the top)
        const allCuits = [...text.matchAll(/\b(\d{2}-\d{8}-\d{1})\b/g)];
        if (allCuits.length >= 2) {
          receptorCuit = allCuits[allCuits.length - 1][1].replace(/-/g, '');
        }
      }

      // 5. Total Amounts
      // "Importe Total: $ 15.000,00"
      const parseAmt = (str: string) => {
        return parseFloat(str.replace(/\./g, '').replace(/,/g, '.'));
      };

      const totalMatch = text.match(/Importe Total:?\s*\$\s*([\d\.,]+)/i);
      const netoMatch = text.match(/Importe Neto Gravado:?\s*\$\s*([\d\.,]+)/i);
      const ivaMatch = text.match(/IVA \d+%:?\s*\$\s*([\d\.,]+)/i);

      let total = 0;
      let neto = 0;
      let iva = 0;

      if (totalMatch) total = parseAmt(totalMatch[1]);
      if (netoMatch) neto = parseAmt(netoMatch[1]);
      if (ivaMatch) iva = parseAmt(ivaMatch[1]);

      if (!neto) neto = total - iva;

      results.push({
        fileName: file.name,
        _cuit: receptorCuit,
        _denominacion: "Cliente extraído del PDF", // Name extraction is messy in PDF, we rely on CUIT matching
        date: dateIso,
        type: isNotaCredito ? 'PAYMENT' : 'CHARGE',
        description: `${isNotaCredito ? 'NC' : 'Factura'} ${pv}-${nro}`,
        receiptNumber: `${pv}-${nro}`,
        amount: total,
        netAmount: neto,
        ivaAmount: iva,
      });
    }

    return NextResponse.json({ success: true, parsed: results });
  } catch (error: any) {
    console.error('Error importing AFIP PDF:', error);
    return NextResponse.json({ error: 'Error al procesar el PDF: ' + error.message }, { status: 500 });
  }
}
