const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!c.includes('import { AlertCircle } from \'lucide-react\'')) {
  c = c.replace(
    'import { prisma } from \'@/lib/prisma\';',
    `import { prisma } from '@/lib/prisma';\nimport { AlertCircle } from 'lucide-react';`
  );
}

const findPromiseEnd = `      select: { amount: true, type: true, category: true, client: { select: { professionalLabel: true } } }\n    })`;
if (!c.includes('// 9. Cheques en cartera')) {
  c = c.replace(
    findPromiseEnd,
    `      select: { amount: true, type: true, category: true, client: { select: { professionalLabel: true } } }\n    }),\n\n    // 9. Cheques en cartera\n    prisma.check.findMany({\n      where: { status: 'IN_PORTFOLIO' },\n      orderBy: { dueDate: 'asc' }\n    })`
  );
}

const findPromiseVars = `    groupedTxs,\n    abonosPeriodData,\n    egresosData`;
if (!c.includes('checksEnCartera')) {
  c = c.replace(
    findPromiseVars,
    `    groupedTxs,\n    abonosPeriodData,\n    egresosData,\n    checksEnCartera`
  );
}

const findFacturacionEstimada = `const facturacionEstimada = facturacionEstimadaAggr._sum.currentFee || 0;`;
if (!c.includes('const getDaysUntilInvalid')) {
  const calculations = `
  const getDaysUntilInvalid = (dueDate: Date) => {
    const validityDate = new Date(dueDate);
    validityDate.setDate(validityDate.getDate() + 30);
    const diffTime = validityDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const expiringRedChecks = checksEnCartera.filter(c => {
    const days = getDaysUntilInvalid(c.dueDate);
    return days >= 0 && days <= 15;
  });

  const expiringYellowChecks = checksEnCartera.filter(c => {
    const days = getDaysUntilInvalid(c.dueDate);
    return days > 15 && days <= 30;
  });\n\n  const facturacionEstimada = facturacionEstimadaAggr._sum.currentFee || 0;`;
  
  c = c.replace(findFacturacionEstimada, calculations);
}

const findEndDiv = `      </div>\n    </div>\n  );\n}`;
if (!c.includes('Atención Tesorería')) {
  const ui = `      </div>

      {(expiringYellowChecks.length > 0 || expiringRedChecks.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Atención Tesorería</h2>
          <div className="space-y-3">
            {expiringRedChecks.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Atención: Hay {expiringRedChecks.length} {expiringRedChecks.length === 1 ? 'cheque' : 'cheques'} que pierden validez en los próximos 15 días.
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {expiringRedChecks.map(c => (
                          <li key={c.id}>
                            {c.bank} N° {c.number} por $\${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} - Vence el {new Date(c.dueDate).toLocaleDateString('es-AR')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {expiringYellowChecks.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Atención: Hay {expiringYellowChecks.length} {expiringYellowChecks.length === 1 ? 'cheque' : 'cheques'} que pierden validez en los próximos 30 días.
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {expiringYellowChecks.map(c => (
                          <li key={c.id}>
                            {c.bank} N° {c.number} por $\${c.amount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} - Vence el {new Date(c.dueDate).toLocaleDateString('es-AR')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}`;
  
  // replace exact closing match to append
  c = c.replace(findEndDiv, ui);
  
  // if line endings mismatch, fallback replace using a regex
  if (c.indexOf('Atención Tesorería') === -1) {
    c = c.replace(/      <\/div>\r?\n    <\/div>\r?\n  \);\r?\n\}/, ui);
  }
}

fs.writeFileSync('src/app/page.tsx', c);
