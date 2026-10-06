const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

c = c.replace(
  /      select: \{ amount: true, type: true, category: true, client: \{ select: \{ professionalLabel: true \} \} \}\r?\n    \}\)/g,
  `      select: { amount: true, type: true, category: true, client: { select: { professionalLabel: true } } }\n    }),\n    // 9. Cheques en cartera\n    prisma.check.findMany({ where: { status: 'IN_PORTFOLIO' }, orderBy: { dueDate: 'asc' } })`
);

c = c.replace(/const expiringRedChecks = checksEnCartera.filter/g, 'const expiringRedChecks = (checksEnCartera || []).filter');
c = c.replace(/const expiringYellowChecks = checksEnCartera.filter/g, 'const expiringYellowChecks = (checksEnCartera || []).filter');

fs.writeFileSync('src/app/page.tsx', c);
