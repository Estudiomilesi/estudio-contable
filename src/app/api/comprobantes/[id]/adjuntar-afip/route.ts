import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

// Reusing PDF logic
const getLetter = (type: string, isNotaCredito: boolean) => {
  if (type === 'FEDE_RI') return isNotaCredito ? 'A' : 'A';
  if (type === 'JUANMA_MONO') return isNotaCredito ? 'C' : 'C';
  return 'X';
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const transactionId = p.id;
    if (!transactionId) {
      return NextResponse.json({ error: 'ID de comprobante faltante' }, { status: 400 });
    }

    const tx = await prisma.accountTransaction.findUnique({
      where: { id: transactionId },
      include: { client: true }
    });

    if (!tx || !tx.client) {
      return NextResponse.json({ error: 'Comprobante o cliente no encontrado' }, { status: 404 });
    }

    // PDF parse patch for Vercel/Next.js
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
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se envió archivo PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = '';
    try {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } catch (error: any) {
      if (error?.message && (error.message.includes('bad XRef entry') || error.message.includes('Invalid PDF structure'))) {
        const PDFParser = require('pdf2json');
        text = await new Promise<string>((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1);
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
          pdfParser.parseBuffer(buffer);
        });
      } else {
        throw error;
      }
    }

    // Parse logic
    const codeMatch = text.match(/(?:COD|C\u00F3digo Nro|Codigo Nro)[.\s:]*0*(\d{1,3})/i);
    const compCode = codeMatch ? parseInt(codeMatch[1]) : 0;
    
    let isNotaCredito = false;
    let typeDesc = "Factura";
    if ([3, 8, 13, 102, 103].includes(compCode)) {
      isNotaCredito = true;
      typeDesc = "NC";
    } else if (text.toLowerCase().includes('nota de cr')) {
      isNotaCredito = true;
      typeDesc = "NC";
    }
    
    let pv = '0000';
    let nro = '00000000';
    
    const fileNameMatch = file.name.match(/^(\d{11})_\d{2,3}_(\d{4,5})_(\d{8})\.pdf$/i);
    if (fileNameMatch) {
      pv = fileNameMatch[2];
      nro = fileNameMatch[3];
    } else {
      const pvMatch = text.match(/Punto\s+de\s+Venta[\s\S]{0,50}?(\d{4,5})/i);
      const nroMatch = text.match(/Punto\s+de\s+Venta[\s\S]{0,150}?(\d{8})/i);
      
      if (pvMatch && nroMatch) {
        pv = pvMatch[1].padStart(4, '0');
        nro = nroMatch[1];
      } else {
        const directNroMatch = text.match(/Nro[.\s:]*(\d{4,5})[-_](\d{8})/i);
        if (directNroMatch) {
          pv = directNroMatch[1].padStart(4, '0');
          nro = directNroMatch[2];
        }
      }
    }

    const letra = getLetter(tx.billingProfile, isNotaCredito);
    const cbteStr = compCode ? ` Cod. ${compCode.toString().padStart(2, '0')} ` : ' ';
    const description = `${typeDesc} ${letra}${cbteStr}${pv}-${nro}`;

    // Update the transaction in DB
    const updatedTx = await prisma.accountTransaction.update({
      where: { id: transactionId },
      data: {
        receiptNumber: `${pv}-${nro}`,
        description,
        isEmailed: true // assume we will send it successfully
      }
    });

    // Send the email with the attached PDF
    if (tx.client.email && tx.client.email !== 'falta@email.com') {
      const studioName = process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' 
        ? 'Estudio Jurídico Cicconi' 
        : (tx.client.professionalLabel === 'F' ? 'Estudio Milesi' : 'Estudio Contable F&J');
      
      const subject = `Comprobante ${description} - ${studioName}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>Comprobante de Pago</h2>
          <p>Estimado/a ${tx.client.name},</p>
          <p>Adjuntamos el comprobante fiscal correspondiente a su último pago/abono.</p>
          <br/>
          <p><strong>Comprobante:</strong> ${description}</p>
          <p><strong>Importe:</strong> $${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
          <br/>
          <p>Saludos cordiales,</p>
          <p><strong>${studioName}</strong></p>
        </div>
      `;

      await sendEmail(tx.client.email, subject, html, [
        {
          filename: file.name,
          content: buffer,
          contentType: 'application/pdf'
        }
      ]);
    }

    return NextResponse.json({ message: 'AFIP vinculado y correo enviado exitosamente', tx: updatedTx });
  } catch (error: any) {
    console.error('Error in adjuntar-afip:', error);
    return NextResponse.json({ error: error.message || 'Error procesando PDF' }, { status: 500 });
  }
}
