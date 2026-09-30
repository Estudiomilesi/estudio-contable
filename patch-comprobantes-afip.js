const fs = require('fs');
let page = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');

const targetActions = `{c.type === 'PAYMENT' ? '-' : ''}\${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right text-xs font-medium">
                      {!c.isEmailed && (
                        <button onClick={() => handleSendHtmlEmail(c)} className="text-gray-400 hover:text-amber-600 mr-2" title="Enviar email al cliente">
                          <Mail size={14} />
                        </button>
                      )}`;

const replaceActions = `{c.type === 'PAYMENT' ? '-' : ''}\${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right text-xs font-medium flex justify-end items-center gap-2">
                      {!c.isEmailed && c.billingProfile === 'NO_FISCAL' && (
                        <button onClick={() => handleSendHtmlEmail(c)} className="text-gray-400 hover:text-amber-600" title="Enviar email interno">
                          <Mail size={14} />
                        </button>
                      )}
                      {!c.isEmailed && c.billingProfile !== 'NO_FISCAL' && (
                        <label className="cursor-pointer text-gray-400 hover:text-blue-600 flex items-center relative" title="Adjuntar Factura AFIP (PDF) y Enviar">
                          <input 
                            type="file" 
                            accept="application/pdf" 
                            className="hidden" 
                            onChange={(e) => handleAdjuntarAFIP(c.id, e)} 
                          />
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                            AFIP <Mail size={12} />
                          </span>
                        </label>
                      )}`;

page = page.replace(targetActions, replaceActions);

const targetImportAFIPFn = `const handleSendHtmlEmail = async (tx: any) => {`;
const replaceImportAFIPFn = `const handleAdjuntarAFIP = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSendHtmlEmail = async (tx: any) => {`;

page = page.replace(targetImportAFIPFn, replaceImportAFIPFn);

fs.writeFileSync('src/app/comprobantes/page.tsx', page);
