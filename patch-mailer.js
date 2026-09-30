const fs = require('fs');
let mailer = fs.readFileSync('src/lib/mailer.ts', 'utf8');

mailer = mailer.replace(
  'export const sendEmail = async (to: string, subject: string, html: string) => {',
  'export const sendEmail = async (to: string, subject: string, html: string, attachments?: any[]) => {'
);

mailer = mailer.replace(
  '    html,\n  });',
  '    html,\n    attachments,\n  });'
);

fs.writeFileSync('src/lib/mailer.ts', mailer);
