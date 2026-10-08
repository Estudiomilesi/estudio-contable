import nodemailer from 'nodemailer';

const defaultTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getTransporter = (senderEmail?: string) => {
  if (senderEmail === 'luisina@estudiomilesi.com' && (process.env.LUISINA_SMTP_USER || process.env.LUCINA_SMTP_USER)) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: (process.env.LUISINA_SMTP_USER || process.env.LUCINA_SMTP_USER),
        pass: (process.env.LUISINA_SMTP_PASS || process.env.LUCINA_SMTP_PASS),
      },
    });
  }
  if (senderEmail === 'juanmartin@estudiomilesi.com' && process.env.JUANMA_SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', 
      auth: {
        user: process.env.JUANMA_SMTP_USER,
        pass: process.env.JUANMA_SMTP_PASS,
      },
    });
  }
  return defaultTransporter;
};

export const sendEmail = async (to: string, subject: string, html: string, attachments?: any[], senderEmail?: string) => {
  if (!process.env.SMTP_USER && !process.env.JUANMA_SMTP_USER && !(process.env.LUISINA_SMTP_USER || process.env.LUCINA_SMTP_USER)) {
    console.warn("SMTP no configurado. Simulando envío a:", to);
    return;
  }
  
  let senderName = process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' ? 'Estudio Jurídico Cicconi' : 'Estudio Contable';
  let fromAddress = process.env.SMTP_FROM || `"${senderName}" <${process.env.SMTP_USER}>`;
  let replyToAddress = undefined;

  if (senderEmail === 'juanmartin@estudiomilesi.com' && process.env.JUANMA_SMTP_USER) {
    senderName = 'Juan Martín Brigi';
    fromAddress = `"${senderName}" <${process.env.JUANMA_SMTP_USER}>`;
  } else if (senderEmail === 'luisina@estudiomilesi.com') {
    senderName = 'Luisina - Estudio Milesi';
    replyToAddress = senderEmail; // Set reply-to even if sending from Fede's email
    
    if ((process.env.LUISINA_SMTP_USER || process.env.LUCINA_SMTP_USER)) {
      fromAddress = `"${senderName}" <${(process.env.LUISINA_SMTP_USER || process.env.LUCINA_SMTP_USER)}>`;
    } else {
      // Si no están las variables, sale con el correo de Fede pero nombre de Luisina
      fromAddress = `"${senderName}" <${process.env.SMTP_USER}>`;
    }
  }
  
  const transporter = getTransporter(senderEmail);

  await transporter.sendMail({
    from: fromAddress,
    replyTo: replyToAddress,
    to,
    subject,
    html,
    attachments,
  });
};
