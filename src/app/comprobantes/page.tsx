"use client";

import { useState, useEffect, useRef } from 'react';
import { Trash2, FileText, Download, Plus, X } from 'lucide-react';
import { jsPDF } from 'jspdf';

type Client = {
  id: string;
  name: string;
  defaultBillingProfile: string;
  professionalLabel: string;
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
  client: { name: string, professionalLabel: string };
  items: { concept: string, amount: number }[];
};

type Concept = {
  id: string;
  name: string;
  type: string;
};

export default function ComprobantesPage() {
  const [isJuanma, setIsJuanma] = useState(false);
  
  useEffect(() => {
    const info = document.getElementById('user-info');
    if (info) {
      try { 
        const isJ = JSON.parse(info.innerText).isJuanma;
        setIsJuanma(isJ); 
        if (isJ) setFilterLabel('FJ_JF');
      } catch(e){}
    }
  }, []);

  const [clientes, setClientes] = useState<Client[]>([]);
  const [billingConcepts, setBillingConcepts] = useState<Concept[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Autocomplete state
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Table state
  const [filterLabel, setFilterLabel] = useState('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

  const [form, setForm] = useState({
    comprobanteType: 'FACTURA',
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    billingProfile: 'NO_FISCAL',
    manualReceiptNumber: '',
    manualDescription: '',
    hasCollaborator: false,
    collaboratorName: '',
    collabCalcType: 'MONTO' as 'MONTO' | 'PORCENTAJE',
    collaboratorValue: '' // Can be amount or percentage
  });
  
  const [items, setItems] = useState<{concept: string, amount: string}[]>([{ concept: '', amount: '' }]);
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [resCli, resComp, resConcepts] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/comprobantes'),
        fetch('/api/conceptos')
      ]);
      const dataCli = await resCli.json();
      const dataComp = await resComp.json();
      const dataConcepts = await resConcepts.json();
      setClientes(dataCli);
      setComprobantes(dataComp);
      setBillingConcepts(dataConcepts.filter((c: any) => c.type === 'BILLING' && c.isActive));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientSelect = (c: Client) => {
    setClientSearch(c.name);
    setShowClientDropdown(false);
    setForm(prev => ({
      ...prev,
      clientId: c.id,
      billingProfile: c.defaultBillingProfile || 'NO_FISCAL'
    }));
  };

  const filteredClientes = clientes.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  // Math
  const netAmountNum = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const ivaAmountNum = form.billingProfile === 'FEDE_RI' ? netAmountNum * 0.21 : 0;
  const totalAmountNum = netAmountNum + ivaAmountNum;
  
  let collaboratorAmount = 0;
  if (form.hasCollaborator && form.collaboratorValue) {
    if (form.collabCalcType === 'PORCENTAJE') {
      collaboratorAmount = totalAmountNum * (parseFloat(form.collaboratorValue) / 100);
    } else {
      collaboratorAmount = parseFloat(form.collaboratorValue);
    }
  }

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
    if (!form.clientId) return alert("Seleccione un cliente");
    if (items.some(i => !i.concept || !i.amount)) return alert("Complete todos los ítems");

    setIsSubmitting(true);
    try {
      let fileBase64 = null;
      if (pdfFile) {
        fileBase64 = await fileToBase64(pdfFile);
      }

      const baseDescription = items.map(i => i.concept).join(' + ');
      const finalDescription = form.manualDescription 
        ? `${baseDescription} (${form.manualDescription})`
        : baseDescription;

      const payload = {
        ...form,
        amount: totalAmountNum,
        netAmount: netAmountNum,
        ivaAmount: ivaAmountNum,
        description: finalDescription,
        items,
        collaboratorAmount,
        receiptFileBase64: fileBase64
      };

      const res = await fetch('/api/comprobantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setForm({
          comprobanteType: 'FACTURA',
          clientId: '',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          billingProfile: 'NO_FISCAL',
          manualReceiptNumber: '',
          manualDescription: '',
          hasCollaborator: false,
          collaboratorName: '',
          collabCalcType: 'MONTO',
          collaboratorValue: ''
        });
        setClientSearch('');
        setItems([{ concept: '', amount: '' }]);
        setPdfFile(null);
        fetchData();
        alert('Comprobante generado con éxito.');
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comprobante? Se revertirán los saldos de cuenta corriente si aplica.')) return;
    try {
      const res = await fetch(`/api/comprobantes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleDownload = (c: Comprobante) => {
    if (c.billingProfile !== 'NO_FISCAL' && c.receiptFileBase64) {
      const a = document.createElement("a");
      a.href = c.receiptFileBase64;
      a.download = `Comprobante_${c.receiptNumber || 'AFIP'}.pdf`;
      a.click();
    } else {
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
      doc.text(`Importe Total: $${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, 90);
      
      if (c.type === 'PAYMENT') {
        doc.text("NOTA DE CRÉDITO", 105, 120, { align: 'center' });
      }

      doc.save(`Comprobante_${c.receiptNumber || 'Interno'}.pdf`);
    }
  };

  const handleAddItem = () => setItems([...items, { concept: '', amount: '' }]);
  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(idx, 1);
      setItems(newItems);
    }
  };
  const handleItemChange = (idx: number, field: 'concept'|'amount', value: string) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedComprobantes = () => {
    let result = [...comprobantes];
    if (filterLabel !== 'ALL') {
      if (filterLabel === 'FJ_JF') {
        result = result.filter(c => c.client?.professionalLabel === 'FJ' || c.client?.professionalLabel === 'JF');
      } else {
        result = result.filter(c => c.client?.professionalLabel === filterLabel);
      }
    }
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'clientName') {
          valA = a.client?.name || '';
          valB = b.client?.name || '';
        } else if (sortConfig.key === 'professionalLabel') {
          valA = a.client?.professionalLabel || '';
          valB = b.client?.professionalLabel || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
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
            
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <label className="block text-sm font-semibold text-blue-900 mb-1">Perfil de Facturación</label>
              <select 
                value={form.billingProfile}
                onChange={e => setForm({...form, billingProfile: e.target.value})}
                className="w-full rounded-md border border-blue-200 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
              >
                <option value="NO_FISCAL">No Fiscal (Gestión Interna)</option>
                <option value="FEDE_RI">Federico - Responsable Inscripto</option>
                <option value="JUANMA_MONO">Juan Manuel - Monotributo</option>
              </select>
            </div>

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
            
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input 
                type="text"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={e => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {showClientDropdown && filteredClientes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredClientes.map(c => (
                    <div 
                      key={c.id} 
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleClientSelect(c)}
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
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

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Conceptos a Facturar</label>
                <button type="button" onClick={handleAddItem} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                  <Plus size={14} /> Agregar
                </button>
              </div>
              
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <select 
                        required
                        value={item.concept}
                        onChange={e => handleItemChange(idx, 'concept', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">-- Concepto --</option>
                        {billingConcepts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="Monto"
                        value={item.amount}
                        onChange={e => handleItemChange(idx, 'amount', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="mt-2 text-red-500 hover:text-red-700">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Aclaración (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej: Honorarios mes en curso..."
                  value={form.manualDescription}
                  onChange={e => setForm({...form, manualDescription: e.target.value})}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal (Neto):</span>
                <span>${netAmountNum.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
              </div>
              {form.billingProfile === 'FEDE_RI' && (
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>IVA (21%):</span>
                  <span>${ivaAmountNum.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-1 mt-1">
                <span>Total a cobrar:</span>
                <span>${totalAmountNum.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            {/* Participación Colaborador */}
            {form.comprobanteType === 'FACTURA' && (
              <div className="border border-gray-200 p-4 rounded-md space-y-3 bg-gray-50">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={form.hasCollaborator}
                    onChange={e => setForm({...form, hasCollaborator: e.target.checked})}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">Asignar participación a Colaborador</span>
                </label>

                {form.hasCollaborator && (
                  <div className="pl-6 space-y-3">
                    <input 
                      type="text" 
                      placeholder="Nombre del colaborador" 
                      required
                      value={form.collaboratorName}
                      onChange={e => setForm({...form, collaboratorName: e.target.value})}
                      className="block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm"
                    />
                    
                    <div className="flex gap-2">
                      <select 
                        value={form.collabCalcType}
                        onChange={e => setForm({...form, collabCalcType: e.target.value as any})}
                        className="w-1/3 rounded-md border border-gray-300 p-2 text-sm shadow-sm"
                      >
                        <option value="MONTO">Monto ($)</option>
                        <option value="PORCENTAJE">Porcentaje (%)</option>
                      </select>
                      <input 
                        type="number" 
                        placeholder={form.collabCalcType === 'MONTO' ? "Ej: 15000" : "Ej: 20"} 
                        required
                        min="0"
                        step={form.collabCalcType === 'PORCENTAJE' ? "1" : "0.01"}
                        value={form.collaboratorValue}
                        onChange={e => setForm({...form, collaboratorValue: e.target.value})}
                        className="flex-1 rounded-md border border-gray-300 p-2 text-sm shadow-sm"
                      />
                    </div>
                    {form.collaboratorValue && (
                      <p className="text-xs font-semibold text-indigo-600">
                        Se asignarán ${collaboratorAmount.toLocaleString('es-AR', {minimumFractionDigits:2})} al colaborador.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {isFiscal && (
              <div className="border border-indigo-100 p-4 rounded-md space-y-3 bg-indigo-50">
                <div>
                  <label className="block text-sm font-medium text-indigo-900 mb-1">N° Comprobante AFIP (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 00004-00000123"
                    value={form.manualReceiptNumber}
                    onChange={e => setForm({...form, manualReceiptNumber: e.target.value})}
                    className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-900 mb-1">Adjuntar PDF de AFIP</label>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={e => setPdfFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : `Registrar ${form.comprobanteType === 'FACTURA' ? 'Factura' : 'Nota de Crédito'}`}
            </button>
          </form>
        </div>

        {/* LISTADO LATERAL (TABLA) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[800px]">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-800">Últimos Comprobantes</h2>
          </div>
          
          <div className="overflow-auto flex-1 p-0">
            <table className="min-w-full divide-y divide-gray-200 relative">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('date')}>Fecha</th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('billingProfile')}>Perfil</th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:bg-gray-200 px-1 rounded" onClick={() => requestSort('professionalLabel')}>Etiq.</span>
                      <select 
                      value={filterLabel} 
                      onChange={e => setFilterLabel(e.target.value)}
                      className="text-[10px] border-gray-300 rounded focus:ring-indigo-500 font-normal p-0 h-4"
                    >
                      <option value={isJuanma ? "FJ_JF" : "ALL"}>Todas</option>
                      {!isJuanma && <option value="F">F</option>}
                      <option value="FJ">FJ</option>
                      <option value="JF">JF</option>
                    </select>
                    </div>
                  </th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('clientName')}>Cliente</th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Cbte</th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Concepto</th>
                  <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('amount')}>Importe</th>
                  <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {processedComprobantes().map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                      {new Date(c.date).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: '2-digit'})}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-[10px] font-medium">
                      {c.billingProfile === 'NO_FISCAL' && <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">No F.</span>}
                      {c.billingProfile === 'FEDE_RI' && <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">F RI</span>}
                      {c.billingProfile === 'JUANMA_MONO' && <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">J Mono</span>}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-center">
                      {c.client?.professionalLabel ? (
                        <span className={`inline-flex rounded-full px-1.5 text-[10px] font-bold leading-4 ${
                          c.client.professionalLabel === 'F' ? 'bg-green-200 text-green-900' : 
                          c.client.professionalLabel === 'FJ' ? 'bg-orange-200 text-orange-900' : 
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {c.client.professionalLabel}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs font-medium text-gray-900 truncate max-w-[100px]" title={c.client?.name}>
                      {c.client?.name}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-[10px] font-mono text-gray-500">
                      {c.receiptNumber || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600 truncate max-w-[120px]" title={c.description}>
                      {c.description}
                    </td>
                    <td className={`px-2 py-2 whitespace-nowrap text-right text-xs font-bold ${c.type === 'CHARGE' ? 'text-gray-900' : 'text-green-600'}`}>
                      {c.type === 'PAYMENT' ? '-' : ''}${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right text-xs font-medium">
                      <button onClick={() => handleDownload(c)} className="text-gray-400 hover:text-indigo-600 mr-2" title="Descargar PDF">
                        <Download size={14} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-600" title="Eliminar comprobante">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {processedComprobantes().length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-2 py-8 text-center text-gray-500 text-sm">No hay comprobantes registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
