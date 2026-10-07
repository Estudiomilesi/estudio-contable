const fs = require('fs');
let c = fs.readFileSync('src/app/api/cron/avisos-deuda/route.ts', 'utf8');

if (!c.includes('maxDuration')) {
  c = "export const maxDuration = 60;\n" + c;
}

c = c.replace(/const batch = forceClientName \? clientsToNotify : clientsToNotify\.slice\(0, 10\);/, 'const batch = clientsToNotify;');

c = c.replace(
  "for (const { client, balance, displayedTransactions } of batch) {",
  `const chunkArray = (arr, size) => arr.length ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)] : [];
    const chunks = chunkArray(batch, 10);
    let sentCount = 0;

    for (const chunk of chunks) {
      const promises = chunk.map(async ({ client, balance, displayedTransactions }) => {`
);

c = c.replace(
  `      } catch(err) {
        console.error('Error sending debt notice to', client.email, err);
      }
    }`,
  `      } catch(err) {
        console.error('Error sending debt notice to', client.email, err);
      }
    });
    await Promise.all(promises);
    // wait 1 second between chunks to avoid SMTP rate limits
    await new Promise(r => setTimeout(r, 1000));
  }`
);

fs.writeFileSync('src/app/api/cron/avisos-deuda/route.ts', c);
