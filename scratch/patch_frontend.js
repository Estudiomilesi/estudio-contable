const fs = require('fs');

let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

// 1. Replace states
c = c.replace(
  `  const [qcAccount, setQcAccount] = useState('CAJA');
  const [qcAmount, setQcAmount] = useState('');
  const [qcDescription, setQcDescription] = useState('');
  const [qcCheckDetails, setQcCheckDetails] = useState({ bank: '', number: '', issueDate: '', dueDate: '', isEcheq: false });`,
  `  const [qcPayments, setQcPayments] = useState([{ id: Date.now(), account: 'CAJA', amount: '', description: '', checkDetails: { bank: '', number: '', issueDate: '', dueDate: '', isEcheq: false } }]);`
);

// 2. Replace openQuickCollect
c = c.replace(
  /const openQuickCollect = \(\) => {[\s\S]*?setIsQuickCollectOpen\(true\);\s*};/,
  `const openQuickCollect = () => {
    if (!selectedClient) return;

    const targetIds = Array.from(selectedChargeIds);
    if (targetIds.length === 0) {
      alert("Seleccioná al menos un comprobante para cobrar.");
      return;
    }

    let totalToCollect = 0;
    targetIds.forEach(id => {
      const charge = selectedClient.transactions.find(tx => tx.id === id);
      if (charge) {
        totalToCollect += (charge.amount - getAppliedAmount(charge));
      }
    });

    setQcPayments([{
      id: Date.now(),
      amount: totalToCollect.toString(),
      account: 'CAJA',
      description: '',
      checkDetails: { bank: '', number: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], isEcheq: false }
    }]);
    setIsQuickCollectOpen(true);
  };`
);

// 3. Replace handleQuickCollectSubmit
c = c.replace(
  /const handleQuickCollectSubmit = async \(e: React\.FormEvent\) => {[\s\S]*?setIsSubmittingQC\(false\);\s*\n\s*};/,
  `const handleQuickCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChargeIds.size === 0 || !selectedClientId) return;
    if (isSubmittingQC) return;

    setIsSubmittingQC(true);
    try {
      const res = await fetch('/api/cuentas-corrientes/cobro-rapido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          payments: qcPayments.map(p => ({
            amount: parseFloat(p.amount),
            account: p.account,
            description: p.description,
            checkDetails: p.account === 'CHEQUES' ? p.checkDetails : undefined
          })),
          selectedChargeIds: Array.from(selectedChargeIds)
        })
      });

      if (res.ok) {
        setIsQuickCollectOpen(false);
        setSelectedChargeIds(new Set());
        fetchClientes();
        
        const accountsUsed = qcPayments.map(p => p.account);
        if (accountsUsed.includes('CAJA') || accountsUsed.includes('CAJA IVA') || accountsUsed.includes('CHEQUES')) {
          if (confirm('Cobro registrado exitosamente. ¿Deseás enviarle el recibo actualizado al cliente por email ahora?')) {
            try {
              fetch('/api/cuentas-corrientes/enviar-reporte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: selectedClientId, viewMode: viewMode })
              }).then(r => r.json()).then(data => {
                if (data.success) alert('Recibo enviado correctamente.');
                else alert('Error al enviar el recibo: ' + data.error);
              });
            } catch (e) {
              alert('Error al enviar el recibo');
            }
          }
        }
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'No se pudo cobrar'));
      }
    } catch (error) {
      alert('Error de red');
    } finally {
      setIsSubmittingQC(false);
    }
  };`
);

// 4. Replace Modal JSX
const oldModalJsxStart = `{/* Modal Quick Collect */}`;
const oldModalJsxRegex = /\{\/\* Modal Quick Collect \*\/\}[\s\S]*?<div className="flex justify-end gap-3 mt-6 pt-4 border-t">/;

const newModalJsx = `{/* Modal Quick Collect */}
        {isQuickCollectOpen && selectedClient && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[500px]">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Cobro Múltiple</h3>
              <p className="text-sm text-gray-700 mb-4">
                Estás por registrar un cobro por <strong>{selectedChargeIds.size} comprobante(s)</strong>.
              </p>
              <form onSubmit={handleQuickCollectSubmit} className="space-y-4">
                
                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                  {qcPayments.map((payment, index) => (
                    <div key={payment.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative shadow-sm">
                      {qcPayments.length > 1 && (
                        <button type="button" onClick={() => setQcPayments(qcPayments.filter(p => p.id !== payment.id))} className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-700 text-sm">✕</button>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-3 mt-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Monto a Cobrar ($)</label>
                          <input 
                            type="number" min="0.01" step="0.01" required
                            value={payment.amount}
                            onChange={e => {
                               const newP = [...qcPayments];
                               newP[index].amount = e.target.value;
                               setQcPayments(newP);
                            }}
                            className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm font-semibold focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Medio de Pago</label>
                          <select 
                            required 
                            value={payment.account}
                            onChange={e => {
                               const newP = [...qcPayments];
                               newP[index].account = e.target.value;
                               setQcPayments(newP);
                            }}
                            className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="CAJA">Caja Efectivo</option>
                            {process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' ? (
                              <option value="BANCO CORI">Banco Cori</option>
                            ) : (
                              <>
                                <option value="CAJA IVA">Caja IVA</option>
                                <option value="BANCOS FEDE">Banco Fede</option>
                                <option value="BANCOS JUANMA">Banco JuanMa</option>
                              </>
                            )}
                            <option value="CHEQUES">Cheques de Terceros</option>
                          </select>
                        </div>
                      </div>

                      {payment.account === 'CHEQUES' && (
                        <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200 space-y-3 mb-3">
                          <h4 className="text-xs font-bold text-yellow-800">Detalles del Cheque</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide">Banco</label>
                              <input type="text" required value={payment.checkDetails.bank} onChange={e => { const newP = [...qcPayments]; newP[index].checkDetails.bank = e.target.value; setQcPayments(newP); }} className="w-full text-sm border rounded p-1" />
                            </div>
                            <div>
                              <div className="flex justify-between items-center"><label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide">Número</label><label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={payment.checkDetails.isEcheq} onChange={e => { const newP = [...qcPayments]; newP[index].checkDetails.isEcheq = e.target.checked; setQcPayments(newP); }} className="rounded border-gray-300 text-indigo-600 w-3 h-3" /><span className="text-[10px] font-bold text-blue-800">Echeq</span></label></div>
                              <input type="text" required value={payment.checkDetails.number} onChange={e => { const newP = [...qcPayments]; newP[index].checkDetails.number = e.target.value; setQcPayments(newP); }} className="w-full text-sm border rounded p-1" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide">F. Emisión</label>
                              <input type="date" required value={payment.checkDetails.issueDate} onChange={e => { const newP = [...qcPayments]; newP[index].checkDetails.issueDate = e.target.value; setQcPayments(newP); }} className="w-full text-sm border rounded p-1" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide">F. Cobro</label>
                              <input type="date" required value={payment.checkDetails.dueDate} onChange={e => { const newP = [...qcPayments]; newP[index].checkDetails.dueDate = e.target.value; setQcPayments(newP); }} className="w-full text-sm border rounded p-1" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Descripción / Detalle (Opcional)</label>
                        <input 
                          type="text" 
                          value={payment.description}
                          onChange={e => {
                             const newP = [...qcPayments];
                             newP[index].description = e.target.value;
                             setQcPayments(newP);
                          }}
                          placeholder="Ej: Cobro parcial..."
                          className="w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-2 px-2">
                  <button type="button" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center" onClick={() => setQcPayments([...qcPayments, { id: Date.now(), amount: '', account: 'CAJA', description: '', checkDetails: { bank: '', number: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], isEcheq: false } }])}>
                    <span className="text-lg mr-1 leading-none">+</span> Agregar pago
                  </button>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Total a cobrar: </span>
                    <span className="font-bold text-lg text-gray-900 ml-2">\${qcPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">`;

c = c.replace(oldModalJsxRegex, newModalJsx);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
