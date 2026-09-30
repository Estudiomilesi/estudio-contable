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
      include: { 
        client: {
          include: { defaultBankAccount: true }
        },
        paymentCondition: true
      }
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
      // Find all potential invoice numbers (00000-00000000)
      const allMatches = [...text.matchAll(/(\d{4,5})[-_](\d{8})/g)];
      let foundPv = null;
      let foundNro = null;
      
      for (const m of allMatches) {
        // Look at only 15 chars back to avoid overlap
        const precedingText = text.substring(Math.max(0, m.index - 15), m.index).toLowerCase();
        
        if (precedingText.includes('brutos') || precedingText.includes('iibb')) {
          continue;
        }
        
        if (precedingText.includes('comp') || precedingText.includes('cbte') || precedingText.includes('nro') || precedingText.includes('factura')) {
          foundPv = m[1];
          foundNro = m[2];
          break;
        }
        if (!foundPv) {
          foundPv = m[1];
          foundNro = m[2];
        }
      }
      
      if (foundPv && foundNro) {
        pv = foundPv.padStart(4, '0');
        nro = foundNro;
      } else {
        const pvMatch = text.match(/Punto\s+de\s+Venta[\s\S]{0,50}?(\d{4,5})/i);
        const nroMatch = text.match(/(?:Comp|Cbte)?[.\s]*Nro[.\s:]*(\d{8})/i);
        if (pvMatch && nroMatch) {
          pv = pvMatch[1].padStart(4, '0');
          nro = nroMatch[1];
        }
      }
    }

    const letra = getLetter(tx.billingProfile, isNotaCredito);
    const cbteStr = compCode ? ` Cod. ${compCode.toString().padStart(2, '0')} ` : ' ';
    const afipDescription = `${typeDesc} ${letra}${cbteStr}${pv}-${nro}`;

    // Update the transaction in DB
    const updatedTx = await prisma.accountTransaction.update({
      where: { id: transactionId },
      data: {
        receiptNumber: `${pv}-${nro}`,
        isEmailed: true // assume we will send it successfully
      }
    });

    // Send the email with the attached PDF
    if (tx.client.email && tx.client.email !== 'falta@email.com') {
      const cliente = tx.client;
      const correosDestino = cliente.email.split(',').map((e: string) => e.trim()).join(', ');
      
      const firma = process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' 
        ? 'Estudio Jurídico Cicconi' 
        : (cliente.professionalLabel === 'F' ? 'Estudio Milesi' : 'Estudio Contable F&J');
      const colorPrincipal = '#7C4751'; 
      const colorFondoEtiqueta = '#F5ECE7';
      const colorTextoEtiqueta = '#55434F';
      const logoUrl = 'https://raw.githubusercontent.com/Estudiomilesi/estudio-contable/main/public/logo-dark.png';

      // Extraer periodo de la descripción
      let periodoStr = '';
      const oldDesc = tx.description || '';
      const matchPeriodo = oldDesc.match(/- ([A-Za-z]+ \d{4})$/);
      if (matchPeriodo) {
        periodoStr = matchPeriodo[1];
      } else {
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        periodoStr = `${meses[tx.date.getMonth()]} ${tx.date.getFullYear()}`;
      }

      let conceptoPrincipal = 'Honorarios Contables';
      let conceptoSecundario = 'Abono Mensual';
      
      const isNC2 = tx.type === 'PAYMENT';
      const titulo = isNC2 ? 'Aviso de Nota de Crédito' : 'Aviso de Honorarios';
      const textoPeriodo = isNC2 
        ? `Te enviamos el detalle de la nota de crédito correspondiente al período` 
        : `Te enviamos el comprobante fiscal y detalle de los honorarios correspondientes al período`;
      const labelTotal = isNC2 ? 'Total a favor' : 'Total a pagar';
      const subject = `${titulo} - ${periodoStr} - ${firma}`;

      const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <div style="padding: 30px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
            <tr>
              <td align="left" valign="middle">
                <h2 style="color: #1e293b; margin: 0; font-size: 22px; border-bottom: 3px solid ${colorPrincipal}; padding-bottom: 5px; display: inline-block;">${titulo}</h2>
              </td>
              <td align="right" valign="middle">
                <img src="${logoUrl}" alt="${firma}" style="max-height: 65px; opacity: 0.9;" />
              </td>
            </tr>
          </table>

          <p style="color: #334155; font-size: 16px;">Hola <strong>${cliente.name}</strong>,</p>
          <p style="color: #334155; font-size: 16px;">Esperamos que te encuentres muy bien.</p>
          <p style="color: #334155; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">${textoPeriodo} <span style="background-color: ${colorFondoEtiqueta}; color: ${colorTextoEtiqueta}; padding: 4px 12px; border-radius: 16px; font-weight: bold; font-size: 15px; display: inline-block; border: 1px solid ${colorPrincipal}; margin-top: 4px; white-space: nowrap;">${periodoStr}</span>.</p>
          
          <!-- Recuadro llamativo del importe -->
          <div style="background-color: #f8fafc; border-left: 5px solid ${colorPrincipal}; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px; line-height: 1.6;"><strong>Comprobante Oficial:</strong> <span style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #475569; white-space: nowrap;">${afipDescription}</span></p>
            <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.8;">
              <strong>Concepto:</strong> 
              <span style="background-color: ${colorFondoEtiqueta}; color: ${colorTextoEtiqueta}; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block; margin-top: 4px;">${conceptoPrincipal} - ${conceptoSecundario}</span>
            </p>
            <p style="margin: 0; font-size: 24px; color: ${colorPrincipal};"><strong>${labelTotal}: ${tx.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></p>
          </div>
          
          ${!isNC2 ? `
            <!-- Datos bancarios -->
            ${cliente.defaultBankAccount ? `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 16px;">🏛️ Datos para transferencia</h3>
              <p style="margin: 0 0 6px 0; color: #15803d; font-size: 15px;"><strong>Banco:</strong> ${cliente.defaultBankAccount.name}</p>
              ${cliente.defaultBankAccount.cbu ? `<p style="margin: 0 0 6px 0; color: #15803d; font-size: 15px;"><strong>CBU/CVU:</strong> ${cliente.defaultBankAccount.cbu}</p>` : ''}
              ${cliente.defaultBankAccount.alias ? `<p style="margin: 0; color: #15803d; font-size: 15px;"><strong>Alias:</strong> ${cliente.defaultBankAccount.alias}</p>` : ''}
            </div>
            ` : ''}

            ${(tx as any).paymentCondition ? `
            <p style="color: #334155; font-size: 15px; line-height: 1.5;"><strong>Condición de pago:</strong> ${(tx as any).paymentCondition.name}</p>
            ` : ''}
            
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Por favor, recordá enviarnos el comprobante de transferencia una vez realizado el pago para poder imputarlo correctamente en tu cuenta.</p>
          ` : `
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Este comprobante generó un saldo a tu favor que se aplicará automáticamente a tus próximos cargos.</p>
          `}
          
          <p style="color: #334155; font-size: 16px; font-weight: 500; margin-top: 25px;">¡Gracias por elegirnos y confiar en nuestro equipo!</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #64748b; font-size: 14px; margin: 0;">Atentamente,</p>
          <p style="color: #0f172a; font-size: 18px; font-weight: bold; margin: 5px 0 0 0;">${firma}</p>
        </div>
      </div>
      `;

      await sendEmail(correosDestino, subject, html, [
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
