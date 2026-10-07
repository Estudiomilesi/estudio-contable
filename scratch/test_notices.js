const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestNoticeClient = await prisma.client.findFirst({
    where: { lastDebtNoticeSent: { not: null } },
    orderBy: { lastDebtNoticeSent: 'desc' },
    select: { lastDebtNoticeSent: true, name: true }
  });
  console.log('Latest notice:', latestNoticeClient);
  if (!latestNoticeClient?.lastDebtNoticeSent) {
      console.log('No notices found');
      return;
  }
  const latestDateStr = latestNoticeClient.lastDebtNoticeSent.toISOString().split('T')[0];
  console.log('Latest Date Str:', latestDateStr);
  const allNotices = await prisma.client.findMany({
    where: { lastDebtNoticeSent: { not: null } },
    select: { name: true, lastDebtNoticeSent: true },
    orderBy: { lastDebtNoticeSent: 'desc' }
  });
  const filtered = allNotices.filter((c) => c.lastDebtNoticeSent.toISOString().split('T')[0] === latestDateStr);
  console.log('Filtered Count:', filtered.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
