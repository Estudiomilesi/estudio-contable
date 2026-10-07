const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

const targetArray = `    egresosData,
    checksEnCartera`;

const replaceArray = `    egresosData,
    checksEnCartera,
    recentDebtNotices`;

const targetQuery = `    // 9. Cheques en cartera
    prisma.check.findMany({
      where: { status: 'IN_PORTFOLIO' },
      orderBy: { dueDate: 'asc' }
    })`;

const replaceQuery = `    // 9. Cheques en cartera
    prisma.check.findMany({
      where: { status: 'IN_PORTFOLIO' },
      orderBy: { dueDate: 'asc' }
    }),
    
    // 10. Avisos de deuda recientes
    (async () => {
      const latestNoticeClient = await prisma.client.findFirst({
        where: { lastDebtNoticeSent: { not: null } },
        orderBy: { lastDebtNoticeSent: 'desc' },
        select: { lastDebtNoticeSent: true }
      });
      if (!latestNoticeClient?.lastDebtNoticeSent) return [];
      
      const latestDateStr = latestNoticeClient.lastDebtNoticeSent.toISOString().split('T')[0];
      const allNotices = await prisma.client.findMany({
        where: { lastDebtNoticeSent: { not: null } },
        select: { name: true, lastDebtNoticeSent: true },
        orderBy: { lastDebtNoticeSent: 'desc' }
      });
      
      return allNotices.filter(c => c.lastDebtNoticeSent.toISOString().split('T')[0] === latestDateStr);
    })()`;

const targetUI = `{(expiringYellowChecks.length > 0 || expiringRedChecks.length > 0) && (`;

const replaceUI = `      {recentDebtNotices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Avisos de Deuda Enviados</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
            <div className="flex">
              <div className="ml-3 w-full">
                <h3 className="text-sm font-medium text-blue-800">
                  El sistema envió {recentDebtNotices.length} avisos de deuda el {new Date(recentDebtNotices[0].lastDebtNoticeSent).toLocaleDateString('es-AR')}.
                </h3>
                <div className="mt-2 text-sm text-blue-700 max-h-40 overflow-y-auto">
                  <ul className="list-disc pl-5 space-y-1">
                    {recentDebtNotices.map((c: any, i: number) => (
                      <li key={i}>{c.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(expiringYellowChecks.length > 0 || expiringRedChecks.length > 0) && (`

if (c.includes(targetQuery)) {
  c = c.replace(targetArray, replaceArray);
  c = c.replace(targetQuery, replaceQuery);
  c = c.replace(targetUI, replaceUI);
  fs.writeFileSync('src/app/page.tsx', c);
}
