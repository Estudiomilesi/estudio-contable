const fs = require('fs');
let code = fs.readFileSync('src/app/reportes/mes/ReportClient.tsx', 'utf-8');

// Totals row colspans for tfoot
const tfootTotalsTarget = `                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right tabular-nums text-sm text-gray-900 uppercase">Totales ({breakdown.total.count} Mov.)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">100%</td>
                    <td colSpan={isFacturado ? 1 : 2}></td>`;

const tfootTotalsNew = `                  <tr>
                    <td colSpan={viewMode === 'AGRUPADO' ? 1 : 2} className="px-6 py-4 text-right tabular-nums text-sm text-gray-900 uppercase">Totales ({breakdown.total.count} Mov.)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{viewMode === 'AGRUPADO' ? breakdown.total.count : '100%'}</td>
                    <td colSpan={viewMode === 'AGRUPADO' ? 0 : (isFacturado ? 2 : 2)}></td>`;

code = code.replace(tfootTotalsTarget, tfootTotalsNew);

code = code.replace(
  `{breakdown.f.count > 0 && (\n                    <tr>`,
  `{breakdown.f.count > 0 && viewMode === 'DETALLADO' && (\n                    <tr>`
);
code = code.replace(
  `{breakdown.fj.count > 0 && (\n                    <tr>`,
  `{breakdown.fj.count > 0 && viewMode === 'DETALLADO' && (\n                    <tr>`
);
code = code.replace(
  `{breakdown.jf.count > 0 && (\n                    <tr>`,
  `{breakdown.jf.count > 0 && viewMode === 'DETALLADO' && (\n                    <tr>`
);
code = code.replace(
  `{breakdown.other.count > 0 && (\n                    <tr>`,
  `{breakdown.other.count > 0 && viewMode === 'DETALLADO' && (\n                    <tr>`
);

fs.writeFileSync('src/app/reportes/mes/ReportClient.tsx', code);
