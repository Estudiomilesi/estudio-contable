const fs = require('fs');
let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

c = c.replace(
  /const \[qcAccount, setQcAccount\] = useState\('CAJA'\);\s*const \[qcAmount, setQcAmount\] = useState\(''\);\s*const \[qcDescription, setQcDescription\] = useState\(''\);\s*const \[qcCheckDetails, setQcCheckDetails\] = useState\(\{ bank: '', number: '', issueDate: '', dueDate: '', isEcheq: false \}\);/g,
  `const [qcPayments, setQcPayments] = useState([{ id: Date.now(), account: 'CAJA', amount: '', description: '', checkDetails: { bank: '', number: '', issueDate: '', dueDate: '', isEcheq: false } }]);`
);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);

let routeCode = fs.readFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', 'utf8');
routeCode = routeCode.replace(/charge\.newlyApplied/g, '(charge as any).newlyApplied');
fs.writeFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', routeCode);
