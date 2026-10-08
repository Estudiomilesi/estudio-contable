const fs = require('fs');

let c = fs.readFileSync('src/lib/mailer.ts', 'utf8');
c = c.replace(
  `const getTransporter = (senderEmail?: string) => {`,
  `const getTransporter = (senderEmail?: string) => {
  if (senderEmail === 'luisina@estudiomilesi.com' && process.env.LUISINA_SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.LUISINA_SMTP_USER,
        pass: process.env.LUISINA_SMTP_PASS,
      },
    });
  }`
);

c = c.replace(
  `  if (senderEmail === 'juanmartin@estudiomilesi.com' && process.env.JUANMA_SMTP_USER) {
    senderName = 'Juan Martín Brigi';
    fromAddress = \`"\${senderName}" <\${process.env.JUANMA_SMTP_USER}>\`;
  }`,
  `  if (senderEmail === 'juanmartin@estudiomilesi.com' && process.env.JUANMA_SMTP_USER) {
    senderName = 'Juan Martín Brigi';
    fromAddress = \`"\${senderName}" <\${process.env.JUANMA_SMTP_USER}>\`;
  } else if (senderEmail === 'luisina@estudiomilesi.com') {
    senderName = 'Luisina - Estudio Milesi';
    if (process.env.LUISINA_SMTP_USER) {
      fromAddress = \`"\${senderName}" <\${process.env.LUISINA_SMTP_USER}>\`;
    }
  }`
);

c = c.replace(
  `  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
    attachments,
  });`,
  `  await transporter.sendMail({
    from: fromAddress,
    replyTo: senderEmail,
    to,
    subject,
    html,
    attachments,
  });`
);

fs.writeFileSync('src/lib/mailer.ts', c);
