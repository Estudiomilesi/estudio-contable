const fs = require('fs');
let page = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf8');

page = page.replace(
  "    dueDate: new Date().toISOString().split('T')[0]\n  }]);",
  "    dueDate: new Date().toISOString().split('T')[0],\n    isEcheq: false\n  }]);"
);

fs.writeFileSync('src/app/tesoreria/page.tsx', page);
