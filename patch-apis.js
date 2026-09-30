const fs = require('fs');

let cobroRapido = fs.readFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', 'utf8');

const cobroTarget = `              number: checkDetails.number,
              issueDate: new Date(checkDetails.issueDate),
              dueDate: new Date(checkDetails.dueDate),
              amount,
              clientId`;

const cobroReplace = `              number: checkDetails.number,
              issueDate: new Date(checkDetails.issueDate),
              dueDate: new Date(checkDetails.dueDate),
              amount,
              isEcheq: checkDetails.isEcheq === true,
              clientId`;

cobroRapido = cobroRapido.replace(cobroTarget, cobroReplace);
fs.writeFileSync('src/app/api/cuentas-corrientes/cobro-rapido/route.ts', cobroRapido);

let tesoreria = fs.readFileSync('src/app/api/tesoreria/route.ts', 'utf8');

const tesoTarget = `            number: c.number,
            bank: c.bank,
            issueDate: new Date(c.issueDate),
            dueDate: new Date(c.dueDate),
            amount: parseFloat(c.amount),
            status: 'IN_PORTFOLIO',
            clientId: data.clientId || null
          })),`;

const tesoReplace = `            number: c.number,
            bank: c.bank,
            issueDate: new Date(c.issueDate),
            dueDate: new Date(c.dueDate),
            amount: parseFloat(c.amount),
            isEcheq: c.isEcheq === true,
            status: 'IN_PORTFOLIO',
            clientId: data.clientId || null
          })),`;

tesoreria = tesoreria.replace(tesoTarget, tesoReplace);
fs.writeFileSync('src/app/api/tesoreria/route.ts', tesoreria);
