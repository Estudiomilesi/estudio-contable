const fs = require('fs');
let code = fs.readFileSync('src/app/reportes/mes/ReportClient.tsx', 'utf-8');

// 1. Fix getConcept to strip "NC - "
const getConceptTarget = `  const getConcept = (desc: string) => {
    if (!desc) return 'Otros';
    if (desc.startsWith('Pago ingresado')) return 'Pago';
    if (desc.startsWith('FACTURA NO VALIDA') || desc.startsWith('Factura')) return 'Honorarios (Manual)';
    
    let concept = desc;
    if (concept.includes(' - ')) {
      concept = concept.split(' - ')[0].trim();
    }
    concept = concept.replace(/\\s*\\([^)]*\\)/g, '').trim();
    
    return concept || 'Otros';
  };`;

const getConceptNew = `  const getConcept = (desc: string) => {
    if (!desc) return 'Otros';
    if (desc.startsWith('Pago ingresado')) return 'Pago';
    if (desc.startsWith('FACTURA NO VALIDA') || desc.startsWith('Factura')) return 'Honorarios (Manual)';
    
    let concept = desc;
    if (concept.startsWith('NC - ')) {
      concept = concept.substring(5).trim();
    }
    if (concept.includes(' - ')) {
      concept = concept.split(' - ')[0].trim();
    }
    concept = concept.replace(/\\s*\\([^)]*\\)/g, '').trim();
    
    return concept || 'Otros';
  };`;

code = code.replace(getConceptTarget, getConceptNew);

// 2. Fix the processedData item expansion logic to respect NC (negative amount)
const itemExpansionTarget = `      if (isFacturado && t.items && t.items.length > 0) {
        t.items.forEach((item: any) => {
          result.push({
            ...t,
            id: item.id, // Usar el ID del item para que sea nico en la tabla
            conceptFromItem: item.concept,
            amount: item.amount,
            netAmount: item.amount, // Los items manuales no tienen IVA desglosado en la DB por item an
            ivaAmount: 0
          });
        });
      } else {`;

const itemExpansionNew = `      if (isFacturado && t.items && t.items.length > 0) {
        t.items.forEach((item: any) => {
          const isNC = t.description && t.description.startsWith('NC');
          const multiplier = isNC ? -1 : 1;
          result.push({
            ...t,
            id: item.id, // Usar el ID del item para que sea unico en la tabla
            conceptFromItem: item.concept,
            amount: Math.abs(item.amount) * multiplier,
            netAmount: Math.abs(item.amount) * multiplier, // Los items manuales no tienen IVA desglosado en la DB por item aun
            ivaAmount: 0
          });
        });
      } else {`;

code = code.replace(itemExpansionTarget, itemExpansionNew);

// 3. Add percentage column to grouped view headers
const headerTarget = `              {viewMode === 'AGRUPADO' ? (
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cant. Movimientos</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal Neto</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">Total Final</th>
                </tr>
              ) : (`;

const headerNew = `              {viewMode === 'AGRUPADO' ? (
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cant. Movimientos</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal Neto</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">Total Final</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% s/ Neto</th>
                </tr>
              ) : (`;

code = code.replace(headerTarget, headerNew);

// 4. Add percentage to grouped view body
const tbodyTarget = `              {viewMode === 'AGRUPADO' ? (
                groupedByConcept.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-2 text-center text-sm text-gray-500">
                      No hay registros para este período.
                    </td>
                  </tr>
                ) : (
                  groupedByConcept.map((g) => (
                    <tr key={g.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {g.name}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                        {g.count}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                        \${g.net.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                        \${g.iva.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right tabular-nums">
                        \${g.total.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                )
              ) : (`;

const tbodyNew = `              {viewMode === 'AGRUPADO' ? (
                groupedByConcept.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-2 text-center text-sm text-gray-500">
                      No hay registros para este período.
                    </td>
                  </tr>
                ) : (
                  groupedByConcept.map((g) => {
                    const pct = currentTotalNeto ? ((g.net / currentTotalNeto) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={g.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {g.name}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                          {g.count}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                          \${g.net.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                          \${g.iva.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right tabular-nums">
                          \${g.total.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-center font-semibold">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (`;

code = code.replace(tbodyTarget, tbodyNew);

fs.writeFileSync('src/app/reportes/mes/ReportClient.tsx', code);
