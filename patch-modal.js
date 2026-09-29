const fs = require('fs');

let modal = fs.readFileSync('src/components/ImportAFIPModal.tsx', 'utf-8');

// 1. Add conceptos prop
modal = modal.replace(
  'clientes: Client[];\n  onImportComplete: () => void;\n}) {',
  'clientes: Client[];\n  conceptos?: any[];\n  onImportComplete: () => void;\n}) {'
);
modal = modal.replace(
  '{ \n  isOpen, \n  onClose, \n  clientes,\n  onImportComplete\n}:',
  '{ \n  isOpen, \n  onClose, \n  clientes,\n  conceptos = [],\n  onImportComplete\n}:'
);

// 2. Default conceptName
modal = modal.replace(
  'description: `${descriptionPrefix}${tipoComp} ${ptoVta}-${nroDesde}`.trim(),\n            receiptNumber:',
  'description: `${descriptionPrefix}${tipoComp} ${ptoVta}-${nroDesde}`.trim(),\n            conceptName: conceptos.length > 0 ? conceptos[0].name : \'Honorarios\',\n            receiptNumber:'
);

// 3. Edit functions
const editFuncs = `
  const handleConceptChange = (index: number, val: string) => {
    const newData = [...parsedData];
    newData[index].conceptName = val;
    setParsedData(newData);
  };
  const handleDescChange = (index: number, val: string) => {
    const newData = [...parsedData];
    newData[index].description = val;
    setParsedData(newData);
  };
`;
modal = modal.replace('const handleImport = async () => {', editFuncs + '\n  const handleImport = async () => {');

// 4. Update Table Headers
modal = modal.replace(
  '<th className="px-3 py-2 text-left font-medium text-gray-500">Comprobante</th>',
  '<th className="px-3 py-2 text-left font-medium text-gray-500">Comprobante</th>\n                      <th className="px-3 py-2 text-left font-medium text-gray-500">Concepto</th>\n                      <th className="px-3 py-2 text-left font-medium text-gray-500">Observación</th>'
);

// 5. Update Table Rows
const rowReplace = `<td className="px-3 py-2 whitespace-nowrap">{tx.description}</td>
                        <td className="px-3 py-2">{tx._denominacion}`;
const rowNew = `<td className="px-3 py-2 whitespace-nowrap text-gray-500">{tx.receiptNumber}</td>
                        <td className="px-3 py-2">
                          <select value={tx.conceptName || ''} onChange={(e) => handleConceptChange(i, e.target.value)} className="w-full text-xs border-gray-300 rounded p-1">
                            {conceptos.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="text" value={tx.description || ''} onChange={(e) => handleDescChange(i, e.target.value)} className="w-full text-xs border-gray-300 rounded p-1" />
                        </td>
                        <td className="px-3 py-2">{tx._denominacion}`;

modal = modal.replace(rowReplace, rowNew);

fs.writeFileSync('src/components/ImportAFIPModal.tsx', modal);
