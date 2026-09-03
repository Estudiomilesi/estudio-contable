"use client";

import { useState, useEffect } from 'react';
import { Trash2, FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

type Client = {
  id: string;
  name: string;
  defaultBillingProfile: string;
};

type Comprobante = {
  id: string;
  clientId: string;
  date: string;
  type: 'CHARGE' | 'PAYMENT';
  amount: number;
  netAmount: number;
  ivaAmount: number;
  description: string;
  receiptNumber: string | null;
  receiptFileBase64: string | null;
  billingProfile: string;
  isEmailed: boolean;
  createdAt: string;
  client: { name: string };
};

export default function ComprobantesPage() {
  const [clientes, setClientes] = useState<Client[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    comprobanteType: 'FACTURA',
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    concept: '',
    billingProfile: 'NO_FISCAL',
    amount: '',
    manualReceiptNumber: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resCli, resComp] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/comprobantes')
      ]);
      const dataCli = await resCli.json();
      const dataComp = await resComp.json();
      setClientes(dataCli);
      setComprobantes(dataComp);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = clientes.find(c => c.id === clientId);
    setForm(prev => ({
      ...prev,
      clientId,
      billingProfile: client?.defaultBillingProfile || 'NO_FISCAL'
    }));
  };

  const netAmountNum = parseFloat(form.amount) || 0;
  const ivaAmountNum = form.billingProfile === 'FEDE_RI' ? netAmountNum * 0.21 : 0;
  const totalAmountNum = netAmountNum + ivaAmountNum;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let fileBase64 = null;
      if (pdfFile) {
        fileBase64 = await fileToBase64(pdfFile);
      }

      const res = await fetch('/api/comprobantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fileBase64 })
      });
      
      if (res.ok) {
        alert('Comprobante emitido exitosamente');
        setForm({
          ...form,
          concept: '',
          amount: '',
          manualReceiptNumber: ''
        });
        setPdfFile(null);
        fetchData(); // Recargar listado
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'Error al emitir'));
      }
    } catch (error) {
      console.error(error);
      alert('Error de red');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, isEmailed: boolean) => {
    if (isEmailed) {
      alert("No se puede eliminar un comprobante que ya fue enviado. Debes hacer una Nota de Crédito.");
      return;
    }
    if (confirm("¿Estás seguro de eliminar este comprobante? Se restará de la deuda del cliente.")) {
      try {
        const res = await fetch(`/api/comprobantes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
        } else {
          const err = await res.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        alert("Error de red");
      }
    }
  };

  const handleDownload = (c: Comprobante) => {
    if (c.billingProfile !== 'NO_FISCAL' && c.receiptFileBase64) {
      // Descargar PDF adjunto
      const a = document.createElement("a");
      a.href = c.receiptFileBase64;
      a.download = `Comprobante_${c.receiptNumber || 'AFIP'}.pdf`;
      a.click();
    } else {
      // Generar nuestro propio PDF
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Estudio Milesi", 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text("Comprobante de Servicio (No Válido como Factura)", 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Número: ${c.receiptNumber || 'S/N'}`, 20, 50);
      doc.text(`Fecha: ${new Date(c.date).toLocaleDateString('es-AR')}`, 20, 60);
      doc.text(`Cliente: ${c.client.name}`, 20, 70);
      doc.text(`Concepto: ${c.description}`, 20, 80);
      doc.text(`Importe Total: $${c.amount.toLocaleString('es-AR')}`, 20, 90);
      
      if (c.type === 'PAYMENT') {
        doc.text("NOTA DE CRÉDITO", 105, 120, { align: 'center' });
      }

      doc.save(`Comprobante_${c.receiptNumber || 'Interno'}.pdf`);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  }

  const isFiscal = form.billingProfile === 'FEDE_RI' || form.billingProfile === 'JUANMA_MONO';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Comprobantes Individuales</h1>
        <p className="text-sm text-gray-500 mt-1">Emití facturas, notas de crédito y adjuntá comprobantes de AFIP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORMULARIO */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Nuevo Comprobante</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select 
                required
                value={form.comprobanteType}
                onChange={e => setForm({...form, comprobanteType: e.target.value})}
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="FACTURA">Factura (Cargo)</option>
                <option value="NOTA_CREDITO">Nota de Crédito (A Favor)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select 
                required
                value={form.clientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emisión</label>
                <input 
                  type="date" 
                  required
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value, dueDate: form.comprobanteType === 'FACTURA' ? e.target.value : form.dueDate})} 
                  className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
              {form.comprobanteType === 'FACTURA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vto.</label>
                  <input 
                    type="date" 
                    required
                    value={form.dueDate}
                    onChange={e => setForm({...form, dueDate: e.target.value})}
                    className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Facturación</label>
              <select 
                required
                value={form.billingProfile}
                onChange={e => setForm({...form, billingProfile: e.target.value})}
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-semibold text-indigo-900"
              >
                <option value="NO_FISCAL">No Fiscal (Auto Num.)</option>
                <option value="FEDE_RI">Fede RI (+21% IVA)</option>
                <option value="JUANMA_MONO">JuanMa Mono</option>
              </select>
            </div>

            {isFiscal && (
              <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subir PDF de AFIP</label>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={e => setPdfFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">El sistema intentará leer el N° automáticamente.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de AFIP (Opcional si sube PDF)</label>
                  <input 
                    type="text" 
                    placeholder="000X-0000XXXX"
                    value={form.manualReceiptNumber}
                    onChange={e => setForm({...form, manualReceiptNumber: e.target.value})}
                    className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
              <input 
                type="text" 
                required
                placeholder="Ej: Certificación..."
                value={form.concept}
                onChange={e => setForm({...form, concept: e.target.value})}
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Neto ($)</label>
              <input 
                type="number" 
                required
                min="0.01"
                step="0.01"
                placeholder="Importe sin IVA..."
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between text-xs mb-1 text-gray-600">
                <span>Neto:</span>
                <span>${netAmountNum.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
              </div>
              {form.billingProfile === 'FEDE_RI' && (
                <div className="flex justify-between text-xs mb-1 text-gray-600">
                  <span>IVA (21%):</span>
                  <span>${ivaAmountNum.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-indigo-900 mt-2 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>${totalAmountNum.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-lg py-3 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${
                form.comprobanteType === 'FACTURA'
                ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {isSubmitting ? 'Procesando...' : `Emitir ${form.comprobanteType === 'FACTURA' ? 'Cargo' : 'NC'}`}
            </button>
          </form>
        </div>

        {/* TABLA HISTÓRICA */}
        <div className="lg:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col h-[calc(100vh-120px)]">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">Últimos Comprobantes</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Número</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cliente</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Perfil</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {comprobantes.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-gray-500">No hay comprobantes emitidos.</td></tr>
                ) : (
                  comprobantes.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(c.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium whitespace-nowrap">
                        {c.type === 'PAYMENT' ? 'NC ' : ''}{c.receiptNumber || 'S/N'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800 truncate max-w-[150px]" title={c.client.name}>
                        {c.client.name}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${c.billingProfile === 'NO_FISCAL' ? 'bg-gray-200 text-gray-700' : c.billingProfile === 'FEDE_RI' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                          {c.billingProfile === 'NO_FISCAL' ? 'No Fis.' : c.billingProfile === 'FEDE_RI' ? 'RI' : 'Mono'}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right font-bold text-sm whitespace-nowrap ${c.type === 'PAYMENT' ? 'text-green-600' : 'text-gray-900'}`}>
                        ${c.amount.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-2 text-center space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => handleDownload(c)} 
                          title={c.receiptFileBase64 ? 'Descargar PDF AFIP' : 'Descargar Comprobante Interno'}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Download size={18} />
                        </button>
                        {(() => {
                          const isHistorical = new Date(c.createdAt) < new Date('2026-09-03T00:00:00Z');
                          const isDisabled = c.isEmailed || isHistorical;
                          const title = isHistorical 
                            ? 'No se puede eliminar un saldo inicial' 
                            : (c.isEmailed ? 'No se puede eliminar (Ya enviado)' : 'Eliminar Comprobante');
                          
                          return (
                            <button 
                              onClick={() => handleDelete(c.id, c.isEmailed)}
                              disabled={isDisabled}
                              title={title}
                              className={isDisabled ? 'text-gray-300' : 'text-red-600 hover:text-red-900'}
                            >
                              <Trash2 size={18} />
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
