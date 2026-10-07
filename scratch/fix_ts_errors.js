const fs = require('fs');

let c = fs.readFileSync('src/app/api/cron/avisos-deuda/route.ts', 'utf8');
c = c.replace(
  /const chunkArray[\s\S]*const promises = chunk\.map\(async \(\{ client, balance, displayedTransactions \}\) => \{/,
  `    let chunks: any[][] = [];
    for (let i = 0; i < batch.length; i += 10) {
      chunks.push(batch.slice(i, i + 10));
    }
    let sentCount = 0;

    for (const chunk of chunks) {
      const promises = chunk.map(async ({ client, balance, displayedTransactions }: any) => {`
);
c = c.replace(
  /displayedTransactions.forEach\(\(tx, idx\) => \{/g,
  `displayedTransactions.forEach((tx: any, idx: number) => {`
);
fs.writeFileSync('src/app/api/cron/avisos-deuda/route.ts', c);

let p = fs.readFileSync('src/app/page.tsx', 'utf8');
p = p.replace(
  /new Date\(recentDebtNotices\[0\]\.lastDebtNoticeSent as Date\)/g,
  `new Date(recentDebtNotices[0].lastDebtNoticeSent as any)`
);
fs.writeFileSync('src/app/page.tsx', p);
