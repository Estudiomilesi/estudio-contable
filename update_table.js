const fs = require('fs');
let code = fs.readFileSync('src/app/reportes/mes/ReportClient.tsx', 'utf-8');

// View mode toggle
const targetDiv = `        <div className="text-right tabular-nums">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total {filterLabel !== 'ALL' ? 'Filtrado' : 'Acumulado'}</p>
          <p className={\`text-4xl font-black \${isFacturado ? 'text-indigo-700' : 'text-green-700'}\`}>
            \${currentTotalNeto.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>`;

const newDiv = `        <div className="text-right tabular-nums">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total {filterLabel !== 'ALL' ? 'Filtrado' : 'Acumulado'}</p>
          <p className={\`text-4xl font-black \${isFacturado ? 'text-indigo-700' : 'text-green-700'}\`}>
            \${currentTotalNeto.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      {isFacturado && (
        <div className="flex border-b border-gray-200 gap-4 mb-4">
          <button
            onClick={() => setViewMode('DETALLADO')}
            className={\`px-4 py-2 font-medium text-sm border-b-2 transition-colors \${viewMode === 'DETALLADO' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            Detallado
          </button>
          <button
            onClick={() => setViewMode('AGRUPADO')}
            className={\`px-4 py-2 font-medium text-sm border-b-2 transition-colors \${viewMode === 'AGRUPADO' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            Agrupado por Concepto
          </button>
        </div>
      )}`;

code = code.replace(targetDiv, newDiv);

// Headers
const theadTarget = `            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('date')}>Fecha {renderSortIcon('date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('client')}>Cliente {renderSortIcon('client')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                  <div className="flex items-center gap-2">
                    <span className="cursor-pointer group flex items-center" onClick={() => requestSort('label')}>
                      Etiqueta {renderSortIcon('label')}
                    </span>
                    <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)} className="text-xs border-gray-300 rounded focus:ring-indigo-500 font-normal py-0 pl-2 pr-6 h-6">
                      <option value={isJuanma ? "FJ_JF" : "ALL"}>Todas</option>
                      {!isJuanma && <option value="F">F</option>}
                      <option value="FJ">FJ</option>
                      <option value="JF">JF</option>
                      <option value="FJ_JF">FJ+JF</option>
                    </select>
                  </div>
                </th>
                {!isFacturado && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('caja')}>Caja {renderSortIcon('caja')}</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('description')}>Detalle {renderSortIcon('description')}</th>
                <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('netAmount')}>Neto {renderSortIcon('netAmount')}</th>
                <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('ivaAmount')}>IVA {renderSortIcon('ivaAmount')}</th>
                <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('amount')}>Total {renderSortIcon('amount')}</th>
              </tr>
            </thead>`;
            
const theadNew = `            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              {viewMode === 'AGRUPADO' ? (
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cant. Movimientos</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal Neto</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider">Total Final</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('date')}>Fecha {renderSortIcon('date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('client')}>Cliente {renderSortIcon('client')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer group flex items-center" onClick={() => requestSort('label')}>
                        Etiqueta {renderSortIcon('label')}
                      </span>
                      <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)} className="text-xs border-gray-300 rounded focus:ring-indigo-500 font-normal py-0 pl-2 pr-6 h-6">
                        <option value={isJuanma ? "FJ_JF" : "ALL"}>Todas</option>
                        {!isJuanma && <option value="F">F</option>}
                        <option value="FJ">FJ</option>
                        <option value="JF">JF</option>
                        <option value="FJ_JF">FJ+JF</option>
                      </select>
                    </div>
                  </th>
                  {!isFacturado && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('caja')}>Caja {renderSortIcon('caja')}</th>}
                  {isFacturado && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('concept')}>Concepto {renderSortIcon('concept')}</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('description')}>Detalle {renderSortIcon('description')}</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('netAmount')}>Neto {renderSortIcon('netAmount')}</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('ivaAmount')}>IVA {renderSortIcon('ivaAmount')}</th>
                  <th className="px-6 py-3 text-right tabular-nums text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => requestSort('amount')}>Total {renderSortIcon('amount')}</th>
                </tr>
              )}
            </thead>`;

code = code.replace(theadTarget, theadNew);

// py-4 to py-2 in tbody and tfoot
let tbodyStartIdx = code.indexOf('<tbody');
let tfootEndIdx = code.indexOf('</tfoot>');
if (tbodyStartIdx !== -1 && tfootEndIdx !== -1) {
  let inner = code.substring(tbodyStartIdx, tfootEndIdx + 8);
  inner = inner.replace(/py-4/g, 'py-2');
  code = code.substring(0, tbodyStartIdx) + inner + code.substring(tfootEndIdx + 8);
}

// Map the body elements
const tbodyTarget = `<tbody className="bg-white divide-y divide-gray-200">
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={isFacturado ? 7 : 8} className="px-6 py-2 text-center text-sm text-gray-500">
                    No hay registros para este período.
                  </td>
                </tr>
              ) : (
                processedData.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">
                      {new Date(t.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-2 text-sm font-medium text-gray-900">
                      {t.client?.name || 'Consumidor Final'}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">
                      {t.client?.professionalLabel ? (
                        <span className={\`inline-flex rounded-full px-2 text-xs font-bold leading-5 \${t.client.professionalLabel === 'F' ? 'bg-green-200 text-green-900' : t.client.professionalLabel === 'FJ' ? 'bg-orange-200 text-orange-900' : 'bg-blue-200 text-blue-900'}\`}>
                          {t.client.professionalLabel}
                        </span>
                      ) : '-'}
                    </td>
                    {!isFacturado && (
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-semibold text-gray-700">
                        {getCaja(t.description || '')}
                      </td>
                    )}
                    <td className="px-6 py-2 text-sm text-gray-500">
                      {t.description}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                      \${(t.netAmount || t.amount).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                      \${(t.ivaAmount || 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right tabular-nums">
                      \${t.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>`;

const tbodyNew = `<tbody className="bg-white divide-y divide-gray-200">
              {viewMode === 'AGRUPADO' ? (
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
              ) : (
                processedData.length === 0 ? (
                  <tr>
                    <td colSpan={isFacturado ? 8 : 8} className="px-6 py-2 text-center text-sm text-gray-500">
                      No hay registros para este período.
                    </td>
                  </tr>
                ) : (
                  processedData.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">
                        {new Date(t.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-2 text-sm font-medium text-gray-900">
                        {t.client?.name || 'Consumidor Final'}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">
                        {t.client?.professionalLabel ? (
                          <span className={\`inline-flex rounded-full px-2 py-0.5 text-xs font-bold leading-5 \${t.client.professionalLabel === 'F' ? 'bg-green-200 text-green-900' : t.client.professionalLabel === 'FJ' ? 'bg-orange-200 text-orange-900' : 'bg-blue-200 text-blue-900'}\`}>
                            {t.client.professionalLabel}
                          </span>
                        ) : '-'}
                      </td>
                      {!isFacturado && (
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-semibold text-gray-700">
                          {getCaja(t.description || '')}
                        </td>
                      )}
                      {isFacturado && (
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 font-medium">
                          {getConcept(t.description || '')}
                        </td>
                      )}
                      <td className="px-6 py-2 text-sm text-gray-500 max-w-xs truncate" title={t.description}>
                        {t.description}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                        \${(t.netAmount || t.amount).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                        \${(t.ivaAmount || 0).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right tabular-nums">
                        \${t.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>`;

code = code.replace(tbodyTarget, tbodyNew);

// Footer breakdown mapping
const viewModeFooterReplace = (original, condition) => {
  return original.replace('<tr>', \`{viewMode === 'DETALLADO' && (<tr>\`);
};

code = code.replace(
  \`{breakdown.f.count > 0 && (\n                    <tr>\`,
  \`{breakdown.f.count > 0 && viewMode === 'DETALLADO' && (\n                    <tr>\`
);
code = code.replace(
  \`{breakdown.fj.count > 0 && (\n                    <tr>\`,
  \`{breakdown.fj.count > 0 && viewMode === 'DETALLADO' && (\n                    <tr>\`
);
code = code.replace(
  \`{breakdown.jf.count > 0 && (\n                    <tr>\`,
  \`{breakdown.jf.count > 0 && viewMode === 'DETALLADO' && (\n                    <tr>\`
);
code = code.replace(
  \`{breakdown.other.count > 0 && (\n                    <tr>\`,
  \`{breakdown.other.count > 0 && viewMode === 'DETALLADO' && (\n                    <tr>\`
);

// Totals row colspans for tfoot
const tfootTotalsTarget = \`                  <tr>
                    <td colSpan={2} className="px-6 py-2 text-right tabular-nums text-sm text-gray-900 uppercase">Totales ({breakdown.total.count} Mov.)</td>
                    <td className="px-6 py-2 text-center text-sm text-gray-700">100%</td>
                    <td colSpan={isFacturado ? 1 : 2}></td>\`;

const tfootTotalsNew = \`                  <tr>
                    <td colSpan={viewMode === 'AGRUPADO' ? 1 : 2} className="px-6 py-2 text-right tabular-nums text-sm text-gray-900 uppercase">Totales ({breakdown.total.count} Mov.)</td>
                    <td className="px-6 py-2 text-center text-sm text-gray-700">{viewMode === 'AGRUPADO' ? breakdown.total.count : '100%'}</td>
                    <td colSpan={viewMode === 'AGRUPADO' ? 0 : (isFacturado ? 2 : 2)}></td>\`;
                    
code = code.replace(tfootTotalsTarget, tfootTotalsNew);

fs.writeFileSync('src/app/reportes/mes/ReportClient.tsx', code);
