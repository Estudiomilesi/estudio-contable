const fs = require('fs');

let api = fs.readFileSync('src/app/api/comprobantes/importar/route.ts', 'utf-8');

const updateTarget = `afipTipoCmp: tx.afipTipoCmp || null,
            // OJO: Se mantiene isEmailed: false para que Fede pueda mandarlo manualmente luego
          }`;

const updateReplace = `afipTipoCmp: tx.afipTipoCmp || null,
            // Actualizamos los items con el nuevo concepto e importe
            items: {
              deleteMany: {},
              create: [
                {
                  concept: tx.conceptName || 'Honorarios',
                  amount: tx.netAmount
                }
              ]
            }
          }`;

api = api.replace(updateTarget, updateReplace);

const createTarget = `afipTipoCmp: tx.afipTipoCmp || null
          }
        });`;

const createReplace = `afipTipoCmp: tx.afipTipoCmp || null,
            items: {
              create: [
                {
                  concept: tx.conceptName || 'Honorarios',
                  amount: tx.netAmount
                }
              ]
            }
          }
        });`;

api = api.replace(createTarget, createReplace);

fs.writeFileSync('src/app/api/comprobantes/importar/route.ts', api);
