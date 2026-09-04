"use client";

import { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Search, Calendar, FileText, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';
import Link from 'next/link';

type TreasuryTransaction = {
  id: string;
  date: string;
  amount: number;
  type: string;
  account: string;
  category: string;
  description: string | null;
  client?: { name: string };
  runningBalance?: number;
  createdAt: string;
};

type Check = {
  id: string;
  number: string;
  bank: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: string;
  clientId: string | null;
  client?: { name: string };
};

const ACCOUNT_COLORS: Record<string, { bg: string, text: string, border: string, ring: string, badgeBg: string }> = {
  'BANCOS FEDE': { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-600', ring: 'ring-green-600', badgeBg: 'bg-green-100 text-green-800' },
  'BANCOS JUANMA': { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-600', ring: 'ring-blue-600', badgeBg: 'bg-blue-100 text-blue-800' },
  'CAJA': { bg: 'bg-stone-100', text: 'text-stone-900', border: 'border-stone-600', ring: 'ring-stone-600', badgeBg: 'bg-stone-100 text-stone-800' },
  'CAJA IVA': { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-600', ring: 'ring-orange-600', badgeBg: 'bg-orange-100 text-orange-800' },
  'CHEQUES': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-600', ring: 'ring-purple-600', badgeBg: 'bg-purple-100 text-purple-800' },
  'DEFAULT': { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-600', ring: 'ring-gray-600', badgeBg: 'bg-gray-100 text-gray-800' }
};

export default function TesoreriaPage() {
  const [transacciones, setTransacciones] = useState<TreasuryTransaction[]>([]);
  const [saldos, setSaldos] = useState<Record<string, number>>({ 
    'CAJA': 0, 'CAJA IVA': 0, 'BANCOS FEDE': 0, 'BANCOS JUANMA': 0, 'CHEQUES': 0 
  });
  const [clientes, setClientes] = useState<{id: string, name: string}[]>([]);
  const [cartera, setCartera] = useState<Check[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [incomingChecks, setIncomingChecks] = useState([{
    bank: '',
    number: '',
    amount: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0]
  }]);
  const [selectedCheckIds, setSelectedCheckIds] = useState<string[]>([]);

  // Estados para Cuentas Corrientes (Aplicar pagos)
  const [pendingCharges, setPendingCharges] = useState<any[]>([]);
  const [selectedChargeIds, setSelectedChargeIds] = useState<Set<string>>(new Set());
  const [isFetchingCharges, setIsFetchingCharges] = useState(false);

  const [selectedFilterAccount, setSelectedFilterAccount] = useState<string | null>(null);

  const [alertDays, setAlertDays] = useState(15);
  const [editingTx, setEditingTx] = useState<TreasuryTransaction | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'INCOME',
    account: 'CAJA',
    category: 'Honorarios',
    amount: '',
    description: '',
    clientId: ''
  });

  const [treasuryConcepts, setTreasuryConcepts] = useState<{id: string, name: string, type: string}[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resT = await fetch('/api/tesoreria');
      const dataT = await resT.json();
      setTransacciones(dataT.transacciones || []);
      setSaldos(dataT.saldos || {});
      setCartera(dataT.cartera || []);

      const resC = await fetch('/api/clientes');
      const dataC = await resC.json();
      setClientes(dataC);

      const resConcepts = await fetch('/api/conceptos');
      const dataConcepts = await resConcepts.json();
      setTreasuryConcepts(dataConcepts.filter((c: any) => (c.type === 'TREASURY_INCOME' || c.type === 'TREASURY_EXPENSE') && c.isActive));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.clientId && formData.type === 'INCOME' && formData.category === 'Honorarios') {
      const fetchCharges = async () => {
        setIsFetchingCharges(true);
        try {
          const res = await fetch(`/api/cuentas-corrientes/pendientes/${formData.clientId}`);
          if (res.ok) {
            const data = await res.json();
            setPendingCharges(data);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsFetchingCharges(false);
        }
      };
      fetchCharges();
    } else {
      setPendingCharges([]);
    }
    setSelectedChargeIds(new Set());
  }, [formData.clientId, formData.type, formData.category]);

  const toggleChargeSelection = (id: string) => {
    const newSet = new Set(selectedChargeIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedChargeIds(newSet);
    
    // Opcional: auto-sumar el importe
    let total = 0;
    newSet.forEach(chargeId => {
      const charge = pendingCharges.find(c => c.id === chargeId);
      if (charge) total += charge.debt;
    });
    if (total > 0 && formData.account !== 'CHEQUES') {
      setFormData(prev => ({ ...prev, amount: total.toString() }));
    }
  };

  const handleSalidaCheque = (checkId: string) => {
    setFormData(prev => ({
      ...prev,
      type: 'EXPENSE',
      account: 'CHEQUES',
      category: 'Otros Egresos' // Default category, user can change it
    }));
    setSelectedCheckIds([checkId]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedAmount = parseFloat(formData.amount || '0');
      const amount = formData.type === 'EXPENSE' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
      
      const payload = { 
        ...formData, 
        amount,
        incomingChecks: formData.account === 'CHEQUES' && formData.type === 'INCOME' ? incomingChecks : undefined,
        selectedCheckIds: formData.account === 'CHEQUES' && formData.type !== 'INCOME' ? selectedCheckIds : undefined,
        selectedChargeIds: Array.from(selectedChargeIds)
      };

      const res = await fetch('/api/tesoreria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFormData({ ...formData, amount: '', description: '', clientId: '' });
        setIncomingChecks([{ number: '', bank: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0] }]);
        setSelectedCheckIds([]);
        fetchData();
      } else {
        const errorData = await res.json();
        alert('Error: ' + (errorData.error || 'Error al guardar el movimiento'));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saldoTotal = Object.entries(saldos)
    .filter(([acc]) => acc !== 'CAJA IVA')
    .reduce((acc, [_, val]) => acc + val, 0);

  // Calcular alertas de cheques (vencen en <= 15 días)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    try {
      const res = await fetch(`/api/tesoreria/${editingTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: editingTx.category, description: editingTx.description })
      });
      if (res.ok) {
        setEditingTx(null);
        fetchData();
      } else {
        alert('Error al actualizar el movimiento');
      }
    } catch(err) {
      alert('Error de conexión');
    }
  };

  const today = new Date();
  const expiringChecks = cartera.filter(c => {
    const diffTime = new Date(c.dueDate).getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= alertDays;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tesorería</h1>
      </div>

      {expiringChecks.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Atención: Hay {expiringChecks.length} {expiringChecks.length === 1 ? 'cheque' : 'cheques'} por vencer en los próximos 15 días.
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {expiringChecks.map(c => (
                    <li key={c.id}>
                      {c.bank} N° {c.number} por ${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} - Vence el {new Date(c.dueDate).toLocaleDateString('es-AR')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saldos Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
        <div 
          onClick={() => setSelectedFilterAccount(null)}
          className={`rounded-xl border bg-white p-6 shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedFilterAccount === null ? 'border-gray-800 border-2 bg-gray-50' : 'border-gray-200'}`}
        >
          <h3 className="text-sm font-medium text-gray-700">Total Disponible</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">${saldoTotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        
        {['CAJA', 'BANCOS FEDE', 'BANCOS JUANMA', 'CHEQUES'].map((acc) => {
          const colors = ACCOUNT_COLORS[acc] || ACCOUNT_COLORS['DEFAULT'];
          const isSelected = selectedFilterAccount === acc;
          return (
            <div 
              key={acc}
              onClick={() => setSelectedFilterAccount(isSelected ? null : acc)}
              className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${colors.bg} ${isSelected ? `${colors.border} border-2 ring-1 ring-inset ${colors.ring}` : 'border-transparent opacity-80 hover:opacity-100'}`}
            >
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>{acc}</h3>
              <p className={`mt-1 text-lg font-bold ${colors.text}`}>${(saldos[acc] || 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          );
        })}
        
        {/* Separated CAJA IVA */}
        <div 
          onClick={() => setSelectedFilterAccount(selectedFilterAccount === 'CAJA IVA' ? null : 'CAJA IVA')}
          className={`rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm cursor-pointer transition-all hover:shadow-md opacity-70 hover:opacity-100 ${selectedFilterAccount === 'CAJA IVA' ? 'border-orange-600 border-2 ring-1 ring-inset ring-orange-600' : ''}`}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-900">CAJA IVA (No Disp.)</h3>
          <p className="mt-1 text-lg font-bold text-orange-900">${(saldos['CAJA IVA'] || 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulario */}
        <div className={`col-span-1 rounded-xl border p-6 shadow-sm h-fit max-h-[800px] overflow-y-auto transition-colors duration-300 ${formData.type === 'INCOME' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h2 className="mb-4 text-xl font-semibold">Registrar Movimiento</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select 
                value={formData.type} 
                onChange={e => {
                  setFormData({
                    ...formData, 
                    type: e.target.value,
                    category: e.target.value === 'INCOME' ? 'Honorarios' : 'Gastos Generales'
                  });
                  setSelectedCheckIds([]);
                }} 
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-medium"
              >
                  <option value="INCOME">Ingreso</option>
                  <option value="EXPENSE">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cuenta</label>
                <select value={formData.account} onChange={e => {
                  setFormData({...formData, account: e.target.value});
                  setSelectedCheckIds([]);
                }} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="CAJA">Caja</option>
                  <option value="CAJA IVA">Caja IVA</option>
                  <option value="BANCOS FEDE">Bancos Fede</option>
                  <option value="BANCOS JUANMA">Bancos Juanma</option>
                  <option value="CHEQUES">Cheques</option>
                </select>
              </div>
              
              {formData.account !== 'CHEQUES' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Importe ($)</label>
                  <input type="number" required min="0" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold" />
                </div>
              )}
            </div>

            {/* CHECK INCOME FIELDS */}
            {formData.account === 'CHEQUES' && formData.type === 'INCOME' && (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-yellow-800">Detalles de Cheques Recibidos</h4>
                  <button 
                    type="button" 
                    onClick={() => setIncomingChecks([...incomingChecks, { bank: '', number: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0] }])}
                    className="text-xs bg-yellow-200 text-yellow-900 px-2 py-1 rounded font-semibold hover:bg-yellow-300"
                  >
                    + Agregar otro cheque
                  </button>
                </div>
                
                {incomingChecks.map((check, index) => (
                  <div key={index} className="space-y-3 p-3 bg-white rounded border border-yellow-300 relative">
                    {incomingChecks.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setIncomingChecks(incomingChecks.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        X Eliminar
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Banco</label>
                        <input type="text" required value={check.bank} onChange={e => {
                          const newChecks = [...incomingChecks];
                          newChecks[index].bank = e.target.value;
                          setIncomingChecks(newChecks);
                        }} className="mt-1 block w-full rounded border-gray-300 p-1.5 text-sm" placeholder="Ej: Galicia" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Número</label>
                        <input type="text" required value={check.number} onChange={e => {
                          const newChecks = [...incomingChecks];
                          newChecks[index].number = e.target.value;
                          setIncomingChecks(newChecks);
                        }} className="mt-1 block w-full rounded border-gray-300 p-1.5 text-sm" placeholder="Ej: 12345678" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Importe ($)</label>
                        <input type="number" required min="0.01" step="0.01" value={check.amount} onChange={e => {
                          const newChecks = [...incomingChecks];
                          newChecks[index].amount = e.target.value;
                          setIncomingChecks(newChecks);
                        }} className="mt-1 block w-full rounded border-gray-300 p-1.5 text-sm font-bold text-green-700" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Emisión</label>
                        <input type="date" required value={check.issueDate} onChange={e => {
                          const newChecks = [...incomingChecks];
                          newChecks[index].issueDate = e.target.value;
                          setIncomingChecks(newChecks);
                        }} className="mt-1 block w-full rounded border-gray-300 p-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Vencimiento</label>
                        <input type="date" required value={check.dueDate} onChange={e => {
                          const newChecks = [...incomingChecks];
                          newChecks[index].dueDate = e.target.value;
                          setIncomingChecks(newChecks);
                        }} className="mt-1 block w-full rounded border-gray-300 p-1.5 text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2 border-t border-yellow-300 flex justify-between items-center">
                  <span className="text-sm font-medium">Total Cobrado:</span>
                  <span className="text-lg font-bold text-green-700">
                    ${incomingChecks.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            )}

            {/* CHECK EXPENSE FIELDS */}
            {formData.account === 'CHEQUES' && formData.type === 'EXPENSE' && (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 space-y-3">
                <h4 className="text-sm font-bold text-blue-800">Seleccionar Cheques para el pago</h4>
                {cartera.length === 0 ? (
                  <p className="text-sm text-red-600">No hay cheques en cartera.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {cartera.map(c => {
                      const isSelected = selectedCheckIds.includes(c.id);
                      return (
                        <label key={c.id} className={`flex items-center p-2 rounded cursor-pointer border ${isSelected ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            className="mr-2"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedCheckIds([...selectedCheckIds, c.id]);
                              else setSelectedCheckIds(selectedCheckIds.filter(id => id !== c.id));
                            }}
                          />
                          <div className="flex-1 text-xs">
                            <div className="font-bold">{c.bank} N° {c.number}</div>
                            <div className="text-gray-600">Vence: {new Date(c.dueDate).toLocaleDateString('es-AR')}</div>
                          </div>
                          <div className="text-sm font-bold text-gray-900">${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </label>
                      )
                    })}
                  </div>
                )}
                <div className="pt-2 border-t border-blue-200 flex justify-between items-center">
                  <span className="text-sm font-medium">Total Seleccionado:</span>
                  <span className="text-lg font-bold text-blue-900">
                    ${cartera.filter(c => selectedCheckIds.includes(c.id)).reduce((acc, c) => acc + c.amount, 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                {formData.type === 'INCOME' ? (
                  <>
                    <option value="Honorarios">Honorarios (Fijo)</option>
                    {treasuryConcepts.filter(c => c.type === 'TREASURY_INCOME').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="Gastos Generales">Gastos Generales (Fijo)</option>
                    <option value="Retiro Fede">Retiro Fede (Fijo)</option>
                    <option value="Retiro Juanma">Retiro Juanma (Fijo)</option>
                    {treasuryConcepts.filter(c => c.type === 'TREASURY_EXPENSE').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {(formData.category === 'Honorarios' || formData.category === 'Participacion') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente (Para Cta. Corriente / Etiqueta P&L)</label>
                  <select value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">-- Seleccionar Cliente --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {formData.clientId && formData.type === 'INCOME' && (
                  <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200 space-y-2">
                    <h4 className="text-sm font-bold text-indigo-800">Aplicar Cobranza a Comprobantes (Opcional)</h4>
                    {isFetchingCharges ? (
                      <p className="text-xs text-indigo-600">Buscando deuda...</p>
                    ) : pendingCharges.length === 0 ? (
                      <p className="text-xs text-green-700 font-bold">¡El cliente no tiene cargos pendientes de pago!</p>
                    ) : (
                      <>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                          {pendingCharges.map(c => {
                            const isSelected = selectedChargeIds.has(c.id);
                            return (
                              <label key={c.id} className={`flex flex-col p-2 rounded cursor-pointer border ${isSelected ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    className="mr-2"
                                    checked={isSelected}
                                    onChange={() => toggleChargeSelection(c.id)}
                                  />
                                  <div className="flex-1 text-xs">
                                    <div className="font-bold text-gray-900">{new Date(c.date).toLocaleDateString('es-AR')} - {c.description}</div>
                                  </div>
                                  <div className="text-sm font-bold text-red-700">Debe ${c.debt.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                        <div className="pt-2 border-t border-indigo-200 flex justify-between items-center">
                          <span className="text-xs font-medium text-indigo-800">Total Seleccionado:</span>
                          <span className="text-sm font-bold text-indigo-900">
                            ${Array.from(selectedChargeIds).reduce((acc, id) => {
                              const ch = pendingCharges.find(p => p.id === id);
                              return acc + (ch ? ch.debt : 0);
                            }, 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción / Concepto</label>
              <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Ej: Pago internet, Factura N°123..." />
            </div>
            
            <button type="submit" disabled={formData.account === 'CHEQUES' && formData.type === 'EXPENSE' && selectedCheckIds.length === 0} className={`w-full rounded-md py-2 px-4 text-white font-medium focus:ring-2 focus:ring-offset-2 ${formData.type === 'INCOME' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed'}`}>
              Registrar {formData.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700">
            Últimos Movimientos
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Fecha</th>
                  {!selectedFilterAccount && <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Cuenta</th>}
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Categoría / Detalle</th>
                  {selectedFilterAccount ? (
                    <>
                      <th className="px-4 py-2 text-right tabular-nums text-xs font-medium text-gray-700 uppercase">Debe</th>
                      <th className="px-4 py-2 text-right tabular-nums text-xs font-medium text-gray-700 uppercase">Haber</th>
                      <th className="px-4 py-2 text-right tabular-nums text-xs font-medium text-gray-700 uppercase">Saldo</th>
                    </>
                  ) : (
                    <th className="px-4 py-2 text-right tabular-nums text-xs font-medium text-gray-700 uppercase">Importe</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(() => {
                  if (isLoading) return <tr><td colSpan={selectedFilterAccount ? 5 : 4} className="px-4 py-4 text-center text-gray-700">Cargando...</td></tr>;
                  
                  const displayedTransacciones = selectedFilterAccount 
                    ? transacciones.filter(t => t.account === selectedFilterAccount)
                    : transacciones;

                  if (displayedTransacciones.length === 0) {
                    return <tr><td colSpan={selectedFilterAccount ? 5 : 4} className="px-4 py-4 text-center text-gray-700">No hay movimientos.</td></tr>;
                  }

                  return displayedTransacciones.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {new Date(t.date).toLocaleDateString('es-AR')}
                      </td>
                      {!selectedFilterAccount && (
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${ACCOUNT_COLORS[t.account]?.badgeBg || ACCOUNT_COLORS['DEFAULT'].badgeBg}`}>
                            {t.account}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-2 text-sm text-gray-900">
                        <div className="font-medium flex items-center justify-between group">
                          <div>{t.category} {t.client ? `- ${t.client.name}` : ''}</div>
                          {t.createdAt && (new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24) <= 3 && (
                            <button 
                              onClick={() => setEditingTx(t)}
                              className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Editar (permitido por 3 días)"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                        <div className="text-gray-700 text-xs truncate max-w-xs" title={t.description || ''}>{t.description}</div>
                      </td>
                      {selectedFilterAccount ? (
                        <>
                          <td className="px-4 py-2 whitespace-nowrap text-right tabular-nums text-sm text-green-600">
                            {t.amount >= 0 ? t.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right tabular-nums text-sm text-red-600">
                            {t.amount < 0 ? Math.abs(t.amount).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right tabular-nums text-sm font-bold text-gray-900">
                            ${(t.runningBalance || 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </>
                      ) : (
                        <td className={`px-4 py-2 whitespace-nowrap text-right tabular-nums text-sm font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                      )}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cartera de Cheques Completa */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-700">Cartera de Cheques</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{cartera.length} en cartera</span>
          </div>
          <Link href="/tesoreria/cheques" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1">
            Ver Historial
          </Link>
        </div>
        <div className="overflow-y-auto flex-1 p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">F. Emisión</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">F. Cobro</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Cliente</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Banco y N°</th>
                <th className="px-4 py-2 text-right tabular-nums text-xs font-medium text-gray-700 uppercase">Importe</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-700">Cargando...</td></tr>
              ) : cartera.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-700">La cartera de cheques está vacía.</td></tr>
              ) : (
                cartera.map((c) => {
                  const diffTime = new Date(c.dueDate).getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isExpiring = diffDays >= 0 && diffDays <= alertDays;
                  const isExpired = diffDays < 0;

                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 ${isExpired ? 'bg-red-50' : isExpiring ? 'bg-yellow-50' : ''}`}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {new Date(c.issueDate).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold flex items-center gap-2">
                        {new Date(c.dueDate).toLocaleDateString('es-AR')}
                        {isExpiring && <span className="bg-yellow-400 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full">Vence en {diffDays} días</span>}
                        {isExpired && <span className="bg-red-400 text-red-900 text-[10px] px-1.5 py-0.5 rounded-full">Vencido</span>}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {c.client ? c.client.name : 'Sin cliente'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                        {c.bank} - N° {c.number}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right tabular-nums text-sm font-bold text-gray-900">
                        ${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSalidaCheque(c.id)}
                          className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded font-semibold transition-colors border border-indigo-200"
                        >
                          Dar salida
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal de Edición */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Editar Movimiento</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select 
                  value={editingTx.category} 
                  onChange={e => setEditingTx({...editingTx, category: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {(() => {
                    const isIncome = editingTx.type === 'INCOME';
                    const fixedOptions = isIncome 
                      ? ['Honorarios'] 
                      : ['Gastos Generales', 'Retiro Fede', 'Retiro Juanma'];
                    const dynamicOptions = treasuryConcepts
                      .filter(c => isIncome ? c.type === 'TREASURY_INCOME' : c.type === 'TREASURY_EXPENSE')
                      .map(c => c.name);
                    
                    const allOptions = [...fixedOptions, ...dynamicOptions];
                    if (!allOptions.includes(editingTx.category)) {
                      allOptions.unshift(editingTx.category);
                    }

                    return allOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ));
                  })()}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción / Concepto</label>
                <input 
                  type="text" 
                  value={editingTx.description || ''} 
                  onChange={e => setEditingTx({...editingTx, description: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
