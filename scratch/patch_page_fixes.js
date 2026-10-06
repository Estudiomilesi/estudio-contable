const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

c = c.replace(
  /    egresosData\r?\n  \] = await Promise\.all\(\[/,
  `    egresosData,\n    checksEnCartera\n  ] = await Promise.all([`
);

c = c.replace(
  /const expiringRedChecks = checksEnCartera.filter\(c => \{/g,
  `const expiringRedChecks = checksEnCartera.filter((c: any) => {`
);

c = c.replace(
  /const expiringYellowChecks = checksEnCartera.filter\(c => \{/g,
  `const expiringYellowChecks = checksEnCartera.filter((c: any) => {`
);

c = c.replace(
  /\{expiringRedChecks.map\(c => \(/g,
  `{expiringRedChecks.map((c: any) => (`
);

c = c.replace(
  /\{expiringYellowChecks.map\(c => \(/g,
  `{expiringYellowChecks.map((c: any) => (`
);

fs.writeFileSync('src/app/page.tsx', c);
