import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { LOGO_BASE64 } from '@/lib/logo';

export const generatePdfDoc = async (c: any, bancos: any[]) => {
  const IS_CORI = process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI';
  const doc = new jsPDF({ compress: true });
  
  // LOGO
  doc.addImage(LOGO_BASE64, 'PNG', 15, 15, 30, 21.2, undefined, 'FAST');
  
  // HEADER TEXT
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const studioName = IS_CORI ? "Estudio Jurídico Cicconi" : (c.client.professionalLabel === 'F' ? "Estudio Milesi" : "Estudio Contable F & J");
  doc.text(studioName, 15, 42);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(IS_CORI ? "Servicios Jurídicos" : "Servicios Contables e Impositivos", 15, 48);
  
  // TIPO DE COMPROBANTE BOX
  doc.setDrawColor(200);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(105, 15, 90, 25, 3, 3, 'FD');
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  const isNC = c.type === 'PAYMENT';
  doc.text(isNC ? "NOTA DE CRÉDITO" : "COMPROBANTE DE HONORARIOS", 150, 24, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`N°: ${c.receiptNumber || 'S/N'}`, 150, 32, { align: 'center' });
  doc.text(`Fecha: ${new Date(c.date).toLocaleDateString('es-AR')}`, 150, 38, { align: 'center' });
  
  // DIVIDER
  doc.setDrawColor(220);
  doc.line(15, 55, 195, 55);
  
  // CLIENT INFO
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("DATOS DEL CLIENTE", 15, 65);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Señor/es: ${c.client.name}`, 15, 73);
  
  // DETAIL TABLE
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLE", 15, 90);
  
  doc.setFillColor(240, 240, 240);
  doc.rect(15, 95, 180, 10, 'F');
  
  doc.setFontSize(10);
  doc.text("Descripción", 20, 101.5);
  doc.text("Importe", 185, 101.5, { align: 'right' });
  
  doc.setFont("helvetica", "normal");
  
  let y = 112;
  if (c.items && c.items.length > 0) {
    c.items.forEach((item: any) => {
      doc.text(item.concept, 20, y);
      doc.text(`$${item.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 185, y, { align: 'right' });
      y += 8;
    });
  } else {
    doc.text(IS_CORI ? 'Honorarios Jurídicos' : 'Honorarios Contables', 20, y);
    doc.text(`$${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 185, y, { align: 'right' });
    y += 8;
  }
  
  let manualDesc = "";
  if (c.items && c.items.length > 0) {
    const baseDesc = c.items.map((i: any) => i.concept).join(' + ');
    if (c.description && c.description.startsWith(baseDesc + ' (')) {
      manualDesc = c.description.slice(baseDesc.length + 2, -1);
    }
  } else {
    manualDesc = c.description;
  }
  
  if (manualDesc) {
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    const descLines = doc.splitTextToSize(`Observaciones: ${manualDesc}`, 170);
    doc.text(descLines, 20, y);
    y += descLines.length * 5 + 4;
  }

  // TOTAL BOX
  doc.setDrawColor(200);
  doc.line(15, y, 195, y);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("TOTAL:", 120, y + 10);
  doc.text(`$${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 185, y + 10, { align: 'right' });
  
  // BANK ACCOUNTS
  let bank = null;
  if (c.billingProfile === 'FEDE_RI') {
    bank = bancos.find(b => b.isFedeRIDefault);
  } else if (c.billingProfile === 'JUANMA_MONO') {
    bank = bancos.find(b => b.isJuanmaMonoDefault);
  } else {
    bank = bancos.find(b => b.id === c.client?.defaultBankAccountId);
  }

  let nextY = y + 25;
  
  const paymentConditionName = c.paymentCondition?.name;
  if (paymentConditionName && !isNC) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    doc.text("CONDICIÓN DE PAGO:", 15, nextY);
    doc.setFont("helvetica", "normal");
    doc.text(paymentConditionName, 60, nextY);
    nextY += 10;
  }

  if (bank && !isNC) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    doc.text("DATOS PARA TRANSFERENCIA:", 15, nextY);
    
    doc.setFont("helvetica", "normal");
    nextY += 6;
    doc.text(`Titular: ${bank.owner}`, 15, nextY);
    if (bank.cuit) { nextY += 6; doc.text(`CUIT: ${bank.cuit}`, 15, nextY); }
    if (bank.cbu || bank.cvu) { nextY += 6; doc.text(`CBU / CVU: ${bank.cbu || bank.cvu}`, 15, nextY); }
    if (bank.alias) { nextY += 6; doc.text(`Alias: ${bank.alias}`, 15, nextY); }
  }
  
  // FISCAL DATA
  if (c.cae) {
    nextY += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    doc.text("DATOS FISCALES AFIP:", 15, nextY);
    
    doc.setFont("helvetica", "normal");
    nextY += 6;
    doc.text(`CAE N°: ${c.cae}`, 15, nextY);
    if (c.caeDueDate) {
      const vto = new Date(c.caeDueDate).toLocaleDateString('es-AR');
      nextY += 6;
      doc.text(`Vencimiento CAE: ${vto}`, 15, nextY);
    }
    
    try {
      const ptoVta = parseInt(c.receiptNumber.split('-')[0]) || 0;
      const nroCmp = parseInt(c.receiptNumber.split('-')[1]) || 0;
      let cuitEmisor = 0;
      if (c.billingProfile === 'FEDE_RI') cuitEmisor = 20316100660;
      else if (c.billingProfile === 'JUANMA_MONO') cuitEmisor = 20301731958;
      
      let cuitReceptor = 0;
      if (c.client?.cuit) {
        cuitReceptor = parseInt(c.client.cuit.replace(/\D/g, '')) || 0;
      }

      const afipQr = {
        ver: 1,
        fecha: c.date.split('T')[0],
        cuit: cuitEmisor,
        ptoVta: ptoVta,
        tipoCmp: c.afipTipoCmp || 11,
        nroCmp: nroCmp,
        importe: c.amount,
        moneda: "PES",
        ctz: 1,
        tipoDocRec: cuitReceptor ? 80 : 99,
        nroDocRec: cuitReceptor,
        tipoCodAut: "E",
        codAut: parseInt(c.cae)
      };
      
      const qrJson = JSON.stringify(afipQr);
      const qrBase64 = btoa(qrJson);
      const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${qrBase64}`;
      
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 80 });
      doc.addImage(qrDataUrl, 'PNG', 150, nextY - 15, 30, 30);
    } catch(e) {
      console.error("Error generando QR", e);
    }
  }

  // FOOTER
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text("¡Muchas gracias por confiar en nuestros servicios!", 105, 275, { align: 'center' });
  
  if (IS_CORI) {
    doc.setFontSize(9);
    doc.text("Estudio Jurídico Cicconi", 105, 282, { align: 'center' });
  } else {
    doc.setFontSize(9);
    doc.text(c.client?.professionalLabel === 'F' ? "CP. Federico Milesi" : "CP. Federico Milesi - CP. Juan M. Brigi", 105, 282, { align: 'center' });
  }
  
  return doc;
};
