const fs = require('fs');

let mailer = `import nodemailer from 'nodemailer';

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
  if (!process.env.SMTP_USER && !process.env.JUANMA_SMTP_USER) {
    console.warn("SMTP no configurado. Simulando envío a:", to);
    return;
  }
  
  let senderName = process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' ? 'Estudio Jurídico Cicconi' : 'Estudio Contable';
  let fromAddress = process.env.SMTP_FROM || \`"\${senderName}" <\${process.env.SMTP_USER}>\`;

  if (senderEmail === 'juanmartin@estudiomilesi.com' && process.env.JUANMA_SMTP_USER) {
    senderName = 'Juan Martín Milesi';
    fromAddress = \`"\${senderName}" <\${process.env.JUANMA_SMTP_USER}>\`;
  }
  
  const transporter = getTransporter(senderEmail);

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
    attachments,
  });
};`;

fs.writeFileSync('src/lib/mailer.ts', mailer);

const replaceSenderInFile = (file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add extraction of senderEmail if request is available
    if (!content.includes("const senderEmail = request.headers.get('x-user-email') || undefined;")) {
      content = content.replace(
        "export async function POST(request: Request) {",
        "export async function POST(request: Request) {\n  const senderEmail = request.headers.get('x-user-email') || undefined;"
      );
    }
    
    if (!content.includes("const senderEmail = request.headers.get('x-user-email') || undefined;")) {
      content = content.replace(
        "export async function POST(request: NextRequest, context: any) {",
        "export async function POST(request: NextRequest, context: any) {\n  const senderEmail = request.headers.get('x-user-email') || undefined;"
      );
    }
    if (!content.includes("const senderEmail = request.headers.get('x-user-email') || undefined;")) {
       content = content.replace(
        "export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {",
        "export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {\n  const senderEmail = request.headers.get('x-user-email') || undefined;"
      );
    }

    // Now update the sendEmail calls to pass senderEmail
    // It could be sendEmail(dest, subj, html) or sendEmail(dest, subj, html, attachments)
    // The safest way is to use regex or string replace. Let's do simple replaces.

    // 1. facturacion/procesar
    if (file.includes('facturacion/procesar')) {
       content = content.replace(
          `htmlEmail\n            );`,
          `htmlEmail,\n              undefined,\n              senderEmail\n            );`
       );
    }

    // 2. comprobantes/enviar
    if (file.includes('comprobantes/enviar/route.ts')) {
       content = content.replace(
          `attachments\n    );`,
          `attachments,\n      senderEmail\n    );`
       );
    }

    // 3. comprobantes/enviar-html
    if (file.includes('comprobantes/enviar-html')) {
       content = content.replace(
          `htmlEmail\n    );`,
          `htmlEmail,\n      undefined,\n      senderEmail\n    );`
       );
    }

    // 4. adjuntar-afip
    if (file.includes('adjuntar-afip')) {
       content = content.replace(
          `attachments\n      );`,
          `attachments,\n        senderEmail\n      );`
       );
    }

    // 5. enviar-reporte
    if (file.includes('enviar-reporte')) {
       content = content.replace(
          `htmlEmail\n    );`,
          `htmlEmail,\n      undefined,\n      senderEmail\n    );`
       );
    }

    fs.writeFileSync(file, content);
  }
};

replaceSenderInFile('src/app/api/facturacion/procesar/route.ts');
replaceSenderInFile('src/app/api/comprobantes/enviar/route.ts');
replaceSenderInFile('src/app/api/comprobantes/enviar-html/route.ts');
replaceSenderInFile('src/app/api/comprobantes/[id]/adjuntar-afip/route.ts');
replaceSenderInFile('src/app/api/cuentas-corrientes/enviar-reporte/route.ts');

console.log('Patch complete.');
