const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

c = c.replace(
  /prisma\.check\.findMany\(\{ where: \{ status: 'IN_PORTFOLIO' \}, orderBy: \{ dueDate: 'asc' \} \}\)\r?\n  \]\);/,
  `prisma.check.findMany({ where: { status: 'IN_PORTFOLIO' }, orderBy: { dueDate: 'asc' } }),
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
      return allNotices.filter((c: any) => c.lastDebtNoticeSent.toISOString().split('T')[0] === latestDateStr);
    })()
  ]);`
);

fs.writeFileSync('src/app/page.tsx', c);
