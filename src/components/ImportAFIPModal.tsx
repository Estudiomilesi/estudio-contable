"use client";

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

type Client = {
  id: string;
  code: string;
  name: string;
  cuit: string | null;
  defaultBillingProfile: string;
  assignedCollaborator: string | null;
  professionalLabel: string;
};

export default function ImportAFIPModal({ 
  isOpen, 
  onClose, 
  clientes,
  onImportComplete
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  clientes: Client[];
  onImportComplete: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseNumber = (val: any) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    // Remove dots for thousands, replace comma with dot for decimals
    const clean = val.toString().replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(clean) || 0;
  };

  const parseDate = (val: any) => {
    if (!val) return new Date();
    // AFIP format is usually DD/MM/YYYY
    const parts = val.toString().split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(val); // fallback
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if they are PDFs
    const isPdf = files.every(f => f.name.toLowerCase().endsWith('.pdf'));

    if (isPdf) {
      setIsLoading(true);
      try {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        const res = await fetch('/api/comprobantes/importar/pdf', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al procesar PDFs');

        // Match clients
        const parsed = data.parsed.map((tx: any, index: number) => {
          let matchedClient = clientes.find(c => c.cuit && c.cuit.replace(/-/g, '') === tx._cuit);
          if (!matchedClient && tx._denominacion && tx._denominacion.length > 3) {
            matchedClient = clientes.find(c => 
              c.name.toLowerCase().includes(tx._denominacion.toLowerCase().substring(0, 8))
            );
          }
          return {
            ...tx,
            clientId: matchedClient?.id || null,
            clientNameMatch: matchedClient?.name || null,
            billingProfile: matchedClient?.defaultBillingProfile || 'NO_FISCAL',
            collaboratorName: matchedClient?.assignedCollaborator || null,
            collaboratorAmount: null
          };
        });
        
        // Append to existing parsed data or replace
        setParsedData(prev => [...prev, ...parsed]);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error al procesar PDFs');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Excel processing (only handles first file)
    const selected = files[0];
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        // Read as array of arrays
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        // Find header row (usually contains "Punto de Venta" or "Fecha")
        let headerIdx = -1;
        for (let i = 0; i < Math.min(10, data.length); i++) {
          if (data[i] && data[i].some(cell => typeof cell === 'string' && cell.toLowerCase().includes('punto de venta'))) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          setError('No se pudo encontrar el encabezado en el archivo. Asegurate de subir el Excel exportado de AFIP "Mis Comprobantes".');
          return;
        }

        const headers = data[headerIdx].map(h => typeof h === 'string' ? h.toLowerCase().trim() : '');
        const rows = data.slice(headerIdx + 1).filter(r => r && r.length > 3 && r[0]); // valid rows

        const parsed = rows.map((row, index) => {
          // Helper to get value by header keyword
          const getVal = (keyword: string) => {
            const idx = headers.findIndex(h => h.includes(keyword));
            return idx !== -1 ? row[idx] : null;
          };

          const fechaRaw = getVal('fecha');
          const tipoComp = getVal('tipo') || '';
          const ptoVta = getVal('punto de venta')?.toString().padStart(4, '0') || '0000';
          const nroDesde = getVal('desde')?.toString().padStart(8, '0') || '00000000';
          const nroDocRaw = getVal('nro. doc.')?.toString().replace(/-/g, '') || '';
          const denominacion = getVal('denominación') || 'Consumidor Final';
          
          const impTotal = parseNumber(getVal('imp. total'));
          const impNeto = parseNumber(getVal('neto gravado'));
          const impNoGrav = parseNumber(getVal('no gravado'));
          const impExento = parseNumber(getVal('exentas'));
          const iva = parseNumber(getVal('iva'));
          
          const isNotaCredito = tipoComp.toLowerCase().includes('nota de crédito');

          let matchedClient = clientes.find(c => c.cuit && c.cuit.replace(/-/g, '') === nroDocRaw);
          
          // Fallback by name similarity if CUIT not found
          if (!matchedClient && denominacion && denominacion.length > 3) {
            matchedClient = clientes.find(c => 
              c.name.toLowerCase().includes(denominacion.toLowerCase().substring(0, 8)) ||
              denominacion.toLowerCase().includes(c.name.toLowerCase().substring(0, 8))
            );
          }

          const txType = isNotaCredito ? 'PAYMENT' : 'CHARGE';
          const descriptionPrefix = isNotaCredito ? 'NC ' : 'Factura ';
          
          return {
            _originalRow: index + 2,
            _denominacion: denominacion,
            _cuit: nroDocRaw,
            
            clientId: matchedClient?.id || null,
            clientNameMatch: matchedClient?.name || null,
            date: parseDate(fechaRaw),
            type: txType,
            billingProfile: matchedClient?.defaultBillingProfile || 'NO_FISCAL',
            amount: impTotal,
            netAmount: impNeto + impNoGrav + impExento || (impTotal - iva),
            ivaAmount: iva,
            description: `${descriptionPrefix}${tipoComp} ${ptoVta}-${nroDesde}`.trim(),
            receiptNumber: `${ptoVta}-${nroDesde}`,
            collaboratorName: matchedClient?.assignedCollaborator || null,
            collaboratorAmount: null // We don't auto-calculate collab splits from AFIP by default to avoid mess
          };
        });

        setParsedData(prev => [...prev, ...parsed]);
      } catch (err) {
        console.error(err);
        setError('Error al procesar el archivo. Verificá que sea un Excel válido.');
      }
    };
    reader.readAsBinaryString(selected);
  };

  const handleImport = async () => {
    const validTxs = parsedData.filter(t => t.clientId);
    if (validTxs.length === 0) {
      setError('No hay comprobantes válidos con clientes asociados para importar.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/comprobantes/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: validTxs })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar');
      
      alert(`¡Importación exitosa! Se importaron ${data.count} comprobantes.`);
      onImportComplete();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validCount = parsedData.filter(t => t.clientId).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Importar Comprobantes desde AFIP</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-800">Instrucciones:</h3>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
              <li>Podés seleccionar los <b>PDFs originales</b> de las Facturas/Notas de Crédito descargadas de AFIP (podés seleccionar varios a la vez).</li>
              <li>O también, exportar desde "Mis Comprobantes &gt; Emitidos" a <b>Excel</b> y subir ese único archivo.</li>
            </ul>
          </div>

          <div>
            <input 
              type="file" 
              multiple
              accept=".pdf,.xls,.xlsx,.csv" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded">{error}</div>}

          {parsedData.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-4 text-sm">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  {validCount} listos para importar
                </span>
                {invalidCount > 0 && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                    {invalidCount} sin cliente asociado (se ignorarán)
                  </span>
                )}
              </div>

              <div className="border rounded-md overflow-x-auto max-h-64">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Comprobante</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Receptor (AFIP)</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Cliente Matcheado</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.map((tx, i) => (
                      <tr key={i} className={!tx.clientId ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2 whitespace-nowrap">{tx.date.toLocaleDateString('es-AR')}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{tx.description}</td>
                        <td className="px-3 py-2">{tx._denominacion} {tx._cuit ? `(${tx._cuit})` : ''}</td>
                        <td className="px-3 py-2 font-medium text-indigo-700">
                          {tx.clientNameMatch || <span className="text-red-500 italic">No encontrado</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right font-medium">
                          ${tx.amount.toLocaleString('es-AR', {minimumFractionDigits:2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancelar
          </button>
          <button 
            onClick={handleImport}
            disabled={isLoading || validCount === 0}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importando...' : 'Confirmar e Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
