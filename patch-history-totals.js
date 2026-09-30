const fs = require('fs');

let page = fs.readFileSync('src/app/facturacion/page.tsx', 'utf8');

const anchor = `  const totales = useMemo(() => {
    let F = 0, FJ = 0, JF = 0, General = 0;
    let countF = 0, countFJ = 0, countJF = 0, countGeneral = 0;
      clientes.forEach(c => {
        const fee = ediciones[c.id] !== undefined ? ediciones[c.id] : c.currentFee;
        General += fee;
        if (fee > 0) {
          countGeneral++;
          if (c.professionalLabel === 'F') { F += fee; countF++; }
          if (c.professionalLabel === 'FJ') { FJ += fee; countFJ++; }
          if (c.professionalLabel === 'JF') { JF += fee; countJF++; }
        } else {
          if (c.professionalLabel === 'F') { F += fee; }
          if (c.professionalLabel === 'FJ') { FJ += fee; }
          if (c.professionalLabel === 'JF') { JF += fee; }
        }
      });
    return { F, FJ, JF, General, countF, countFJ, countJF, countGeneral };
  }, [clientes, ediciones]);`;

// Make sure we correctly replace this exact block, handling whitespace dynamically if needed.
// Wait, regex might be safer.

const regexTotales = /const totales = useMemo\(\(\) => \{[\s\S]*?\}, \[clientes, ediciones\]\);/g;

const newTotales = `const totales = useMemo(() => {
    let F = 0, FJ = 0, JF = 0, General = 0;
    let countF = 0, countFJ = 0, countJF = 0, countGeneral = 0;
    const history: Record<string, { F: number, FJ: number, JF: number, General: number }> = {};
    
    historyDates.forEach(d => {
      history[d] = { F: 0, FJ: 0, JF: 0, General: 0 };
    });

    clientes.forEach(c => {
      const fee = ediciones[c.id] !== undefined ? ediciones[c.id] : c.currentFee;
      General += fee;
      if (fee >= 0) {
        countGeneral++;
        if (c.professionalLabel === 'F') { F += fee; countF++; }
        if (c.professionalLabel === 'FJ') { FJ += fee; countFJ++; }
        if (c.professionalLabel === 'JF') { JF += fee; countJF++; }
      }

      historyDates.forEach(month => {
        const tx = c.accountTransactions?.find(t => t.description && t.description.startsWith('Abono Mensual') && t.date.startsWith(month));
        if (tx) {
          history[month].General += tx.amount;
          if (c.professionalLabel === 'F') history[month].F += tx.amount;
          if (c.professionalLabel === 'FJ') history[month].FJ += tx.amount;
          if (c.professionalLabel === 'JF') history[month].JF += tx.amount;
        }
      });
    });
    
    return { F, FJ, JF, General, countF, countFJ, countJF, countGeneral, history };
  }, [clientes, ediciones, historyDates]);`;

if (page.match(regexTotales)) {
  page = page.replace(regexTotales, newTotales);
  console.log('Replaced totales block');
} else {
  console.log('totales block not found!');
}

// Now replace the tfoot rendering
// First row General:
page = page.replace(
  '<td colSpan={historyDates.length + 1}></td>',
  `<td className="px-2 py-2 border-r border-gray-200"></td>
                  {historyDates.map(month => (
                    <td key={month} className="px-2 py-2 text-right tabular-nums text-gray-400 text-[11px] font-normal italic">
                      {totales.history[month].General.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  ))}`
);

// Second row F:
page = page.replace(
  '<td colSpan={historyDates.length + 1}></td>',
  `<td className="px-2 py-1 border-r border-gray-200"></td>
                    {historyDates.map(month => (
                      <td key={month} className="px-2 py-1 text-right tabular-nums text-gray-400 text-[11px] font-normal italic">
                        {totales.history[month].F.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    ))}`
);

// Third row FJ:
page = page.replace(
  '<td colSpan={historyDates.length + 1}></td>',
  `<td className="px-2 py-1 border-r border-gray-200"></td>
                      {historyDates.map(month => (
                        <td key={month} className="px-2 py-1 text-right tabular-nums text-gray-400 text-[11px] font-normal italic">
                          {totales.history[month].FJ.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                      ))}`
);

// Fourth row JF:
page = page.replace(
  '<td colSpan={historyDates.length + 1}></td>',
  `<td className="px-2 py-1 border-r border-gray-200"></td>
                      {historyDates.map(month => (
                        <td key={month} className="px-2 py-1 text-right tabular-nums text-gray-400 text-[11px] font-normal italic">
                          {totales.history[month].JF.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                      ))}`
);


fs.writeFileSync('src/app/facturacion/page.tsx', page);
console.log('Facturacion page.tsx fully patched for history totals');
