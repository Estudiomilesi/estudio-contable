"use client";
import ClientNotesModal from '@/components/ClientNotesModal';

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileSpreadsheet, FileText, Send, MessageSquare } from 'lucide-react';
type PaymentApplication = {
  id: string;
  amount: number;
  payment?: {
    description: string | null;
  };
};

type Transaction = {
  id: string;
  date: string;
  type: 'CHARGE' | 'PAYMENT';
  amount: number;
  description: string;
  dueDate?: string | null;
  runningBalance: number;
  paymentsApplied?: PaymentApplication[];
  chargesCovered?: PaymentApplication[];
  isFullyApplied: boolean;
};

type ClientWithBalance = {
  id: string;
  code: string;
  name: string;
  professionalLabel: string;
  balance: number;
  unappliedPayments: number;
  unpaidCharges: number;
  transactions: Transaction[];
  defaultBankAccount?: any;
};

const IS_SINGLE_USER = process.env.NEXT_PUBLIC_SINGLE_USER_MODE === 'true';

export default function CuentasCorrientesPage() {
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

  const [clientes, setClientes] = useState<ClientWithBalance[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'ALL' | 'PENDING'>('ALL');

  // Application Modal state
  const [applyingPayment, setApplyingPayment] = useState<Transaction | null>(null);
  const [applyAmount, setApplyAmount] = useState<string>('');

  // Quick Collect state
  const [selectedChargeIds, setSelectedChargeIds] = useState<Set<string>>(new Set());
  const [isQuickCollectOpen, setIsQuickCollectOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [qcPayments, setQcPayments] = useState([{ id: Date.now(), account: 'CAJA', amount: '', description: '', checkDetails: { bank: '', number: '', issueDate: '', dueDate: '', isEcheq: false } }]);
  const [isSubmittingQC, setIsSubmittingQC] = useState(false);
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: keyof ClientWithBalance, direction: 'asc' | 'desc' } | null>({ key: 'code', direction: 'asc' });
  const [filterLabel, setFilterLabel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cuentas-corrientes');
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredAndSortedClientes = useMemo(() => {
    let result = [...clientes];
    
    if (filterLabel !== 'ALL') {
      if (filterLabel === 'FJ_JF') {
        result = result.filter(c => c.professionalLabel === 'FJ' || c.professionalLabel === 'JF');
      } else {
        result = result.filter(c => c.professionalLabel === filterLabel);
      }
    }

    if (searchTerm && searchTerm.length >= 3) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        (c.name?.toLowerCase().includes(lowerSearch) || false) || 
        (c.code?.toLowerCase().includes(lowerSearch) || false)
      );
    }

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];
        
        if (sortConfig.key === 'code' || sortConfig.key === 'balance') {
          const aNum = parseFloat(aValue as string);
          const bNum = parseFloat(bValue as string);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            aValue = aNum;
            bValue = bNum;
          }
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue as string).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [clientes, sortConfig, filterLabel, searchTerm]);

  const requestSort = (key: keyof ClientWithBalance) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const listTotals = useMemo(() => {
    let debt = 0; // Lo que nos deben
    let credit = 0; // Lo que debemos
    filteredAndSortedClientes.forEach(c => {
      if (c.balance > 0) debt += c.balance;
      else if (c.balance < 0) credit += Math.abs(c.balance);
    });
    return { debt, credit, total: debt - credit };
  }, [filteredAndSortedClientes]);

  const selectedClient = useMemo(() => {
    return clientes.find(c => c.id === selectedClientId) || null;
  }, [clientes, selectedClientId]);

  useEffect(() => {
    setSelectedChargeIds(new Set());
  }, [selectedClientId]);

  // Helpers to calculate applied amounts on the fly
  const getAppliedAmount = (tx: Transaction) => {
    if (tx.type === 'CHARGE' && tx.paymentsApplied) {
      return tx.paymentsApplied.reduce((sum, app) => sum + app.amount, 0);
    }
    if (tx.type === 'PAYMENT' && tx.chargesCovered) {
      return tx.chargesCovered.reduce((sum, app) => sum + app.amount, 0);
    }
    return 0;
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingPayment) return;
    if (isSubmittingApply) return;

    setIsSubmittingApply(true);

    let chargeIdsToApply: string[] = [];
    if (selectedChargeIds.size > 0) {
      chargeIdsToApply = Array.from(selectedChargeIds);
    }

    if (chargeIdsToApply.length === 0) {
      alert("Seleccioná al menos un cargo para aplicar.");
      return;
    }

    try {
      const res = await fetch('/api/cuentas-corrientes/aplicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: applyingPayment.id,
          chargeIds: chargeIdsToApply
        })
      });

      if (res.ok) {
        setApplyingPayment(null);
        setApplyAmount('');
        setSelectedChargeIds(new Set());
        fetchClientes(); // refresh data
      } else {
        const err = await res.json();
        alert('Error al aplicar el pago: ' + (err.error || ''));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingApply(false);
    }
  };

  const openApplyModal = (payment: Transaction) => {
    setApplyingPayment(payment);
    const unapplied = payment.amount - getAppliedAmount(payment);
    setApplyAmount(unapplied.toString());
  };

  const toggleChargeSelection = (chargeId: string) => {
    const newSet = new Set(selectedChargeIds);
    if (newSet.has(chargeId)) {
      newSet.delete(chargeId);
    } else {
      newSet.add(chargeId);
    }
    setSelectedChargeIds(newSet);
  };

  const handleOpenQuickCollect = (preselectId?: string) => {
    if (!selectedClient) return;

    let targetIds = new Set(selectedChargeIds);
    if (preselectId) {
      targetIds = new Set([preselectId]);
      setSelectedChargeIds(targetIds);
    }

    if (targetIds.size === 0) {
      alert("Seleccioná al menos un comprobante para cobrar.");
      return;
    }

    // Calcular el monto sugerido
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
  };

  const handleQuickCollectSubmit = async (e: React.FormEvent) => {
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

      const resData = await res.json();
      if (res.ok) {
        setIsQuickCollectOpen(false);
        setSelectedChargeIds(new Set());
        fetchClientes();
        
        if (resData.alerts && resData.alerts.length > 0) {
          let alertMsg = '⚠️ ATENCIÓN: El cobro realizado incluía honorarios con participación de colaboradores.\n\n';
          resData.alerts.forEach((a: any) => {
            alertMsg += `- A ${a.collaborator} le corresponden ${a.amount.toLocaleString('es-AR', {minimumFractionDigits: 2})} por el cliente ${a.client}\n`;
          });
          alertMsg += '\nPor favor, recordá registrar el pago al colaborador en Tesorería.';
          alert(alertMsg);
        }
        
        const accountsUsed = qcPayments.map(p => p.account);
        if (accountsUsed.includes('CAJA') || accountsUsed.includes('CAJA IVA') || accountsUsed.includes('CHEQUES')) {
          if (confirm('Cobro registrado exitosamente. ¿Deseás enviarle el recibo actualizado al cliente por email ahora?')) {
            try {
              fetch('/api/cuentas-corrientes/enviar-recibo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountTxIds: resData.results.map((r: any) => r.accountTxId) })
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
  };

  const exportClientExcel = () => {
    if (!selectedClient) return;
    
    const displayedTransactions = selectedClient.transactions.filter(tx => {
      if (viewMode === 'ALL') return true;
      const applied = getAppliedAmount(tx);
      return applied < tx.amount;
    });

    const data = displayedTransactions.map(tx => {
      const applied = getAppliedAmount(tx);
      const isCharge = tx.type === 'CHARGE';
      const isPayment = tx.type === 'PAYMENT';
      const debe = isCharge ? (viewMode === 'PENDING' ? tx.amount - applied : tx.amount) : 0;
      const haber = isPayment ? (viewMode === 'PENDING' ? tx.amount - applied : tx.amount) : 0;
      
      return {
        Fecha: new Date(tx.date).toLocaleDateString('es-AR'),
        Vencimiento: tx.dueDate ? new Date(tx.dueDate).toLocaleDateString('es-AR') : '',
        Concepto: tx.description || (isCharge ? 'Cargo' : 'Pago'),
        Debe: debe,
        Haber: haber,
        Saldo: viewMode === 'PENDING' ? '-' : tx.runningBalance
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const sheetName = viewMode === 'PENDING' ? "Composicion Saldos" : "Cuenta Corriente";
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    XLSX.writeFile(wb, `${sheetName.replace(/\s+/g, '_')}_${selectedClient.name.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleSendEmail = async () => {
    if (!selectedClient) return;
    if (!confirm(`¿Estás seguro de que deseas enviar este reporte de cuenta corriente a ${selectedClient.name}?`)) return;

    try {
      // Usamos toast o un alert simple
      const res = await fetch('/api/cuentas-corrientes/enviar-reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          viewMode: viewMode // 'ALL' o 'PENDING'
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Reporte enviado correctamente por email.');
      } else {
        alert('Error al enviar el reporte: ' + data.error);
      }
    } catch (error) {
      alert('Error de conexión al enviar el reporte.');
    }
  };

  const exportClientPDF = () => {
    if (!selectedClient) return;
    const doc = new jsPDF();
    
    const isMilesi = selectedClient.professionalLabel === 'F';
    const primaryColor: [number, number, number] = [124, 71, 81]; // #7C4751
    const firma = process.env.NEXT_PUBLIC_STUDIO_NAME === 'CORI' 
      ? 'Estudio Jurídico Cicconi' 
      : (isMilesi ? 'Estudio Milesi' : 'Estudio Contable F&J');
    
    const title = viewMode === 'PENDING' ? 'Composición de Saldos' : 'Estado de Cuenta Corriente';
    
    // Título principal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, 14, 20);
    
    // Firma a la derecha
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(firma, 196, 20, { align: 'right' });
    
    // Línea separadora
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1.5);
    doc.line(14, 24, 196, 24);
    
    // Saludo
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Hola `, 14, 34);
    doc.setFont('helvetica', 'bold');
    doc.text(`${selectedClient.name}`, 24, 34);
    doc.setFont('helvetica', 'normal');
    doc.text(',', 24 + doc.getTextWidth(selectedClient.name), 34);
    
    doc.text('Te enviamos el reporte de estado de tu cuenta corriente actualizado a la fecha.', 14, 42);
    
    // Cuadro de saldo
    const isDebt = selectedClient.balance > 0;
    
    // Fondo del cuadro
    doc.setFillColor(isDebt ? 254 : 240, isDebt ? 242 : 253, isDebt ? 242 : 244); // bg-red-50 : bg-green-50
    doc.roundedRect(14, 50, 182, 28, 2, 2, 'F');
    // Borde izquierdo
    doc.setFillColor(isDebt ? 239 : 34, isDebt ? 68 : 197, isDebt ? 68 : 94); // text-red-500 : text-green-500
    doc.rect(14, 50, 3, 28, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('Estado actual:', 22, 58);
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    if (isDebt) {
      doc.setTextColor(185, 28, 28); // red-700
      doc.text(`Saldo a pagar: $${selectedClient.balance.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 22, 68);
    } else {
      doc.setTextColor(21, 128, 61); // green-700
      doc.text(`Saldo a favor: $${Math.abs(selectedClient.balance).toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 22, 68);
    }
    
    doc.setFont('helvetica', 'normal');
    
    const displayedTransactions = selectedClient.transactions.filter(tx => {
      if (viewMode === 'ALL') return true;
      const applied = getAppliedAmount(tx);
      return applied < tx.amount;
    });

    const tableColumn = ["Fecha", "Concepto", "Debe", "Haber", "Saldo"];
    const tableRows = displayedTransactions.map(tx => {
      const applied = getAppliedAmount(tx);
      const isCharge = tx.type === 'CHARGE';
      const isPayment = tx.type === 'PAYMENT';
      const debeStr = isCharge ? `$${(viewMode === 'PENDING' ? tx.amount - applied : tx.amount).toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-';
      const haberStr = isPayment ? `$${(viewMode === 'PENDING' ? tx.amount - applied : tx.amount).toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-';
      const saldoStr = viewMode === 'PENDING' ? '-' : `$${tx.runningBalance.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
      
      return [
        new Date(tx.date).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'}),
        tx.description || (isCharge ? 'Cargo' : 'Pago'),
        debeStr,
        haberStr,
        saldoStr
      ];
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      theme: 'plain',
      headStyles: { 
        textColor: [148, 163, 184], // slate-400
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        lineColor: [226, 232, 240], // slate-200
        lineWidth: { bottom: 0.5 }
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 6,
        textColor: [51, 65, 85]
      },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 28 },
        1: { cellWidth: 'auto' },
        2: { halign: 'right', textColor: [220, 38, 38], fontStyle: 'bold', cellWidth: 30 },
        3: { halign: 'right', textColor: [22, 163, 74], fontStyle: 'bold', cellWidth: 30 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 30 }
      }
    });
    
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Check if we need new page for bank details
    if (isDebt && selectedClient.defaultBankAccount) {
      if (finalY > 240) {
        doc.addPage();
        finalY = 20;
      }
      
      // Draw bank details box
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(14, finalY, 182, 35, 3, 3, 'FD');
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.setFont('helvetica', 'bold');
      doc.text('Datos para transferencia', 20, finalY + 10);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Banco: `, 20, finalY + 18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedClient.defaultBankAccount.name}`, 20 + doc.getTextWidth('Banco: '), finalY + 18);
      
      if (selectedClient.defaultBankAccount.cbu) {
        doc.setFont('helvetica', 'normal');
        doc.text(`CBU/CVU: `, 20, finalY + 24);
        doc.setFont('helvetica', 'bold');
        doc.text(`${selectedClient.defaultBankAccount.cbu}`, 20 + doc.getTextWidth('CBU/CVU: '), finalY + 24);
      }
      
      if (selectedClient.defaultBankAccount.alias) {
        doc.setFont('helvetica', 'normal');
        doc.text(`Alias: `, 20, finalY + 30);
        doc.setFont('helvetica', 'bold');
        doc.text(`${selectedClient.defaultBankAccount.alias}`, 20 + doc.getTextWidth('Alias: '), finalY + 30);
      }
      
      finalY += 50;
    }
    
    if (isDebt) {
      if (finalY > 270) {
        doc.addPage();
        finalY = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text('Por favor, recordá enviarnos el comprobante de transferencia una vez realizado el pago para poder imputarlo', 14, finalY);
      doc.text('correctamente en tu cuenta.', 14, finalY + 5);
      finalY += 15;
    }
    
    if (finalY > 270) {
      doc.addPage();
      finalY = 20;
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('¡Gracias por elegirnos y confiar en nuestro equipo!', 14, finalY);
    
    finalY += 15;
    if (finalY > 270) {
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Atentamente,', 14, finalY);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(firma, 14, finalY + 6);
    
    doc.save(`${title.replace(/\s+/g, '_')}_${selectedClient.name.replace(/\s+/g, '_')}.pdf`);
  };

  const exportGlobalExcel = () => {
    const data = filteredAndSortedClientes.map(c => ({
      Codigo: c.code,
      Cliente: c.name,
      Etiqueta: c.professionalLabel,
      Saldo_AFavor: c.balance < 0 ? Math.abs(c.balance) : 0,
      Saldo_Deudor: c.balance > 0 ? c.balance : 0,
      Saldo_Neto: c.balance
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Saldos");
    XLSX.writeFile(wb, `Saldos_Clientes.xlsx`);
  };

  const exportGlobalPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Saldos de Cuentas Corrientes`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Total A Cobrar: $${listTotals.debt.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 14, 28);
    doc.text(`Total A Favor: $${listTotals.credit.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 14, 34);
    
    const tableColumn = ["Cód", "Cliente", "Etiqueta", "Saldo a Favor", "Saldo Deudor"];
    const tableRows = filteredAndSortedClientes.map(c => [
      c.code,
      c.name,
      c.professionalLabel,
      c.balance < 0 ? `$${Math.abs(c.balance).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-',
      c.balance > 0 ? `$${c.balance.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    });
    doc.save(`Saldos_Clientes.pdf`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] gap-6">
      {/* Columna Izquierda: Lista de clientes */}
      <div className="w-full lg:w-1/3 flex flex-col border rounded-xl bg-white shadow-sm overflow-hidden min-h-[400px] lg:min-h-0">
        <div className="overflow-auto flex-1 p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th colSpan={4} className="px-3 py-3 border-b border-gray-200 bg-gray-50 text-left text-lg font-bold text-gray-800">
                  <div className="flex justify-between items-center mb-3">
                    <span>Cuentas Corrientes</span>
                    <div className="flex gap-2 text-gray-500">
                      <button onClick={exportGlobalExcel} title="Exportar a Excel" className="hover:text-green-600 transition-colors"><FileSpreadsheet size={18} /></button>
                      <button onClick={exportGlobalPDF} title="Exportar a PDF" className="hover:text-red-600 transition-colors"><FileText size={18} /></button>
                    </div>
                  </div>
                  <div className="relative w-full">
                    <input 
                      type="text" 
                      placeholder="Buscar (min 3 letras)..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full text-sm font-normal border-gray-300 rounded-md p-1.5 pl-8 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </th>
              </tr>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200" onClick={() => requestSort('code')}>
                  Cód
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200" onClick={() => requestSort('name')}>
                  Cliente
                </th>
                {!IS_SINGLE_USER && (
                  <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <span className="cursor-pointer hover:bg-gray-200 px-1 rounded" onClick={() => requestSort('professionalLabel')}>Etiq</span>
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
                )}
                <th className="px-3 py-2 text-right tabular-nums text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200" onClick={() => requestSort('balance')}>
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Cargando...</td></tr>
              ) : filteredAndSortedClientes.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No hay clientes.</td></tr>
              ) : (
                filteredAndSortedClientes.map(c => (
                  <tr 
                    key={c.id} 
                    onClick={() => setSelectedClientId(c.id)}
                    className={`cursor-pointer hover:bg-indigo-50 transition-colors ${selectedClientId === c.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                  >
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {c.code}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 font-medium truncate max-w-[150px]" title={c.name}>
                      {c.name}
                    </td>
                    {!IS_SINGLE_USER && (
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          c.professionalLabel === 'F' ? 'bg-green-200 text-green-900' : 
                          c.professionalLabel === 'FJ' ? 'bg-orange-200 text-orange-900' : 
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {c.professionalLabel}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2 text-right tabular-nums">
                      <div className={`text-sm font-bold ${c.balance > 0 ? 'text-red-700' : c.balance < 0 ? 'text-green-700' : 'text-gray-700'}`}>
                        ${Math.abs(c.balance).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-bold sticky bottom-0 z-10 border-t-2 border-gray-300 text-xs">
              <tr>
                <td colSpan={3} className="px-3 py-1 text-right tabular-nums text-red-800">A Cobrar</td>
                <td className="px-3 py-1 text-right tabular-nums text-red-900">${listTotals.debt.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-3 py-1 text-right tabular-nums text-green-800">Saldos a Favor</td>
                <td className="px-3 py-1 text-right tabular-nums text-green-900">${listTotals.credit.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-3 py-1.5 text-right tabular-nums text-gray-800 border-t border-gray-300">Total Neto</td>
                <td className={`px-3 py-1.5 text-right tabular-nums border-t border-gray-300 ${listTotals.total > 0 ? 'text-red-900' : listTotals.total < 0 ? 'text-green-900' : 'text-gray-900'}`}>
                  ${Math.abs(listTotals.total).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Columna Derecha: Detalle de la cuenta corriente */}
      <div className="w-full lg:w-2/3 flex flex-col border rounded-xl bg-white shadow-sm overflow-hidden relative min-h-[500px] lg:min-h-0">
        {selectedClient ? (
          <>
            <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                <p className="text-sm text-gray-700 mt-1">
                  Pagos sin aplicar: <span className="font-semibold text-green-700">${selectedClient.unappliedPayments.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> | 
                  Cargos impagos: <span className="font-semibold text-red-700">${selectedClient.unpaidCharges.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </p>
              </div>
              <div className="text-right tabular-nums">
                <div className={`text-3xl font-black mb-2 ${selectedClient.balance > 0 ? 'text-red-700' : selectedClient.balance < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                  Saldo: ${selectedClient.balance.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="flex justify-end gap-3 mb-3 text-gray-500">
                  <button onClick={() => setIsNotesModalOpen(true)} title="Seguimiento (Notas)" className="hover:text-blue-600 transition-colors"><MessageSquare size={20} /></button>
                  <button onClick={exportClientExcel} title="Descargar en Excel" className="hover:text-green-600 transition-colors"><FileSpreadsheet size={20} /></button>
                  <button onClick={exportClientPDF} title="Descargar en PDF" className="hover:text-red-600 transition-colors"><FileText size={20} /></button>
                  <button onClick={handleSendEmail} title="Enviar por Email" className="hover:text-indigo-600 transition-colors text-indigo-500"><Send size={20} /></button>
                </div>
                <div className="inline-flex bg-gray-200 p-1 rounded-md">
                  <button 
                    onClick={() => setViewMode('ALL')}
                    className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'ALL' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setViewMode('PENDING')}
                    className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'PENDING' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Composición de Saldos
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-auto flex-1 p-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 w-8"></th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase">Fecha</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase">Vto.</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase">Detalle</th>
                    <th className="px-3 py-3 text-right tabular-nums text-xs font-bold text-gray-700 uppercase">Debe</th>
                    <th className="px-3 py-3 text-right tabular-nums text-xs font-bold text-gray-700 uppercase">Haber</th>
                    <th className="px-3 py-3 text-right tabular-nums text-xs font-bold text-gray-700 uppercase">Saldo</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(() => {
                    const displayedTransactions = selectedClient.transactions.filter(tx => {
                      if (viewMode === 'ALL') return true;
                      const applied = getAppliedAmount(tx);
                      return applied < tx.amount; // Only keep pending ones
                    });

                    if (displayedTransactions.length === 0) {
                      return <tr><td colSpan={8} className="p-8 text-center text-gray-500">No hay movimientos pendientes.</td></tr>;
                    }

                    return displayedTransactions.map(tx => {
                      const applied = getAppliedAmount(tx);
                      const isFullyApplied = applied >= tx.amount;
                      const isCharge = tx.type === 'CHARGE';
                      
                      return (
                        <tr key={tx.id} className={`hover:bg-gray-50 ${selectedChargeIds.has(tx.id) ? 'bg-indigo-50' : ''}`}>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            {isCharge && !isFullyApplied && (
                              <input 
                                type="checkbox"
                                checked={selectedChargeIds.has(tx.id)}
                                onChange={() => toggleChargeSelection(tx.id)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                            {new Date(tx.date).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold">
                            {isCharge ? (
                              <span className={((tx.dueDate && new Date(tx.dueDate) < new Date()) || (!tx.dueDate && new Date(tx.date) < new Date())) && !isFullyApplied ? 'text-red-600' : 'text-gray-700'}>
                                {new Date(tx.dueDate || tx.date).toLocaleDateString('es-AR')}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900">
                            {tx.description}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-sm font-semibold text-red-700 whitespace-nowrap">
                            {isCharge ? `$${(viewMode === 'PENDING' ? tx.amount - applied : tx.amount).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : ''}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-sm font-semibold text-green-700 whitespace-nowrap">
                            {tx.type === 'PAYMENT' ? `$${(viewMode === 'PENDING' ? tx.amount - applied : tx.amount).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : ''}
                          </td>
                          <td className={`px-3 py-3 text-right tabular-nums text-sm font-bold whitespace-nowrap ${tx.runningBalance > 0 ? 'text-red-700' : tx.runningBalance < 0 ? 'text-green-700' : 'text-gray-700'}`}>
                            {viewMode === 'PENDING' ? '-' : `$${tx.runningBalance.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                          </td>
                          <td className="px-3 py-3 text-center text-sm whitespace-nowrap space-y-1">
                            {isCharge ? (
                              isFullyApplied ? (
                                (() => {
                                  // Revisar si algún pago aplicado es NC
                                  const isAppliedByNC = tx.paymentsApplied?.some(app => app.payment?.description?.includes('NC -') || app.payment?.description?.includes('Anula Comprobantes'));
                                  if (isAppliedByNC) {
                                    return <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">Aplicado</span>;
                                  }
                                  return <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">Pagado</span>;
                                })()
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  {viewMode === 'ALL' && (
                                    <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-800">
                                      Debe ${ (tx.amount - applied).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }
                                    </span>
                                  )}
                                  <button 
                                    onClick={() => handleOpenQuickCollect(tx.id)}
                                    title="Cobrar Ahora"
                                    className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-0.5 text-[10px] font-bold shadow-sm transition-colors"
                                  >
                                    $ Cobrar
                                  </button>
                                </div>
                              )
                            ) : (
                              isFullyApplied ? (
                                <span className="inline-flex rounded-full bg-gray-200 px-2 py-1 text-xs font-bold text-gray-800">Aplicado</span>
                              ) : (
                                <button 
                                  onClick={() => openApplyModal(tx)}
                                  className="inline-flex rounded bg-indigo-100 hover:bg-indigo-200 px-2 py-1 text-[10px] font-bold text-indigo-800 transition-colors"
                                >
                                  Aplicar Pago
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      )
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Seleccioná un cliente de la lista para ver su estado de cuenta
          </div>
        )}

        {/* Modal Aplicar Pago */}
        {applyingPayment && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[450px]">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Aplicar Saldo a Favor</h3>
              <p className="text-sm text-gray-700 mb-4">
                Saldo Disponible: <strong>${(applyingPayment.amount - getAppliedAmount(applyingPayment)).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
              </p>
              
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Seleccionar Comprobantes a Cancelar</label>
                  <div className="max-h-56 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1 bg-gray-50">
                    {selectedClient?.transactions
                      .filter(t => t.type === 'CHARGE' && getAppliedAmount(t) < t.amount)
                      .map(t => (
                        <label key={t.id} className={`flex items-start gap-3 p-2 rounded cursor-pointer border transition-colors ${selectedChargeIds.has(t.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={selectedChargeIds.has(t.id)}
                            onChange={() => toggleChargeSelection(t.id)}
                            className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <div className="text-sm flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-900">{new Date(t.date).toLocaleDateString('es-AR')}</span>
                              <span className="text-red-600 font-bold">Debe: ${(t.amount - getAppliedAmount(t)).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                            </div>
                            <div className="text-gray-500 text-xs mt-0.5">{t.description || 'Cargo'}</div>
                          </div>
                        </label>
                      ))
                    }
                    {selectedClient?.transactions.filter(t => t.type === 'CHARGE' && getAppliedAmount(t) < t.amount).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No hay comprobantes adeudados.</p>
                    )}
                  </div>
                  {selectedChargeIds.size > 0 && (
                    <p className="text-sm text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-100 font-medium mt-2">
                      Se aplicará el saldo secuencialmente a los {selectedChargeIds.size} comprobantes seleccionados (hasta cubrir el saldo disponible).
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setApplyingPayment(null)}
                    className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    {isSubmittingApply ? 'Procesando...' : (selectedChargeIds.size > 0 ? 'Aplicar a Seleccionados' : 'Confirmar Aplicación')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Floating Bulk Collect Button */}
        {selectedChargeIds.size > 0 && selectedClient && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-20 animate-fade-in-up">
            <span className="font-bold flex items-center gap-2">
              {selectedChargeIds.size} seleccionados
              <span className="bg-indigo-800 text-indigo-100 px-2 py-0.5 rounded text-sm whitespace-nowrap">
                ($ {Array.from(selectedChargeIds).reduce((sum, id) => {
                  const charge = selectedClient.transactions.find(tx => tx.id === id);
                  return sum + (charge ? charge.amount - getAppliedAmount(charge) : 0);
                }, 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})
              </span>
            </span>
            <button 
              onClick={() => handleOpenQuickCollect()}
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-1.5 rounded-full font-black text-sm transition-colors"
            >
              $ Cobrar Seleccionados
            </button>
            <button 
              onClick={() => setSelectedChargeIds(new Set())}
              className="text-indigo-200 hover:text-white"
            >
              x
            </button>
          </div>
        )}

        {/* Modal Quick Collect */}
        {isNotesModalOpen && selectedClient && (
          <ClientNotesModal 
            client={selectedClient} 
            onClose={() => setIsNotesModalOpen(false)} 
          />
        )}

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
                    <span className="font-bold text-lg text-gray-900 ml-2">${qcPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button 
                    type="button" 
                    onClick={() => setIsQuickCollectOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingQC}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmittingQC ? 'Procesando...' : 'Confirmar Cobro y Aplicar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
