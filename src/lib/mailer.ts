import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_USER) {
    console.warn("SMTP no configurado. Simulando envío a:", to);
    return;
  }
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Estudio Contable" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};
