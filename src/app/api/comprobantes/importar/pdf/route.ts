import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    // Vercel/Next.js bug fix for pdf-parse module.parent isDebugMode
    const fs = require('fs');
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = (path: any, options: any): any => {
      if (typeof path === 'string' && path.includes('05-versions-space.pdf')) {
        return Buffer.from('');
      }
      return originalReadFileSync(path, options);
    };
    const pdfParse = require('pdf-parse');
    fs.readFileSync = originalReadFileSync;

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
      let pv = '0000';
      let nro = '00000000';
      
      const fileNameMatch = file.name.match(/^(\d{11})_\d{2,3}_(\d{4,5})_(\d{8})\.pdf$/i);
      if (fileNameMatch) {
        pv = fileNameMatch[2];
        nro = fileNameMatch[3];
      } else {
        const pvMatch = text.match(/Punto\s+de\s+Venta[\s\S]{0,50}?(\d{4,5})/i);
        const nroMatch = text.match(/Punto\s+de\s+Venta[\s\S]{0,150}?(\d{8})/i);
        pv = pvMatch ? pvMatch[1].padStart(4, '0') : '0000';
        nro = nroMatch ? nroMatch[1] : '00000000';
      }
      
      // 3. Date
      const dateMatch = text.match(/Fecha\s+de\s+Emisi[\s\S]{1,300}?(\d{2}\/\d{2}\/\d{4})/i);
      let dateIso = new Date().toISOString();
      if (dateMatch) {
        const parts = dateMatch[1].split('/');
        // YYYY-MM-DDT12:00:00.000Z to avoid timezone offsets changing the day
        dateIso = `${parts[2]}-${parts[1]}-${parts[0]}T12:00:00.000Z`;
      }

      // 4. CUITs
      // Get all valid CUIT-like 11 digit numbers (handle dashes and spaces, using lookarounds to avoid consuming boundaries)
      const allCuits = [...text.matchAll(/(?<=^|\D)(20|23|24|27|30|33|34)[\s-]*(\d{8})[\s-]*(\d{1})(?=\D|$)/g)];
      // Unique CUITs stripped of dashes/spaces
      const uniqueCuits = Array.from(new Set(allCuits.map(m => (m[1] + m[2] + m[3]))));
      
      // Inject CUIT from filename if we found it, to guarantee the issuer is at least present
      if (fileNameMatch) {
        const fileCuit = fileNameMatch[1];
        if (!uniqueCuits.includes(fileCuit)) {
          uniqueCuits.unshift(fileCuit);
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
        _cuits: uniqueCuits,
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
