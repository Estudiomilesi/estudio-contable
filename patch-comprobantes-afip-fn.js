const fs = require('fs');
let page = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');

const t2 = `const handleSendHtmlEmail = async (c: Comprobante) => {`;
const r2 = `const handleAdjuntarAFIP = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('¿Adjuntar PDF de AFIP y enviar por email al cliente automáticamente?')) {
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(\`/api/comprobantes/\${id}/adjuntar-afip\`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert('Factura adjuntada y correo enviado.');
        fetchData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Ocurrió un error al subir el PDF');
    }
    e.target.value = '';
  };

  const handleSendHtmlEmail = async (c: Comprobante) => {`;

page = page.split(t2).join(r2);
fs.writeFileSync('src/app/comprobantes/page.tsx', page);
