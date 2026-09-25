const fs = require('fs');

let page = fs.readFileSync('src/app/clientes/page.tsx', 'utf-8');

const target = `    if (!isEditing && clientes.length > 0) {
      const nums = clientes
        .map(c => parseInt(c.code, 10))
        .filter(n => !isNaN(n) && n !== 999);
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      setFormData(prev => ({ ...prev, code: (max + 1).toString() }));
    }`;

const replacement = `    if (!isEditing && clientes.length > 0) {
      const nums = clientes
        .map(c => parseInt(c.code, 10))
        .filter(n => !isNaN(n))
        .sort((a,b) => a - b);
      
      let maxNormal = 0;
      if (nums.length > 0) {
        maxNormal = nums[0];
        for (let i = 1; i < nums.length; i++) {
          if (nums[i] - nums[i-1] > 100) {
            break; // Stop if there is a massive gap (e.g., jump to 999 or 2912)
          }
          maxNormal = nums[i];
        }
      }
      setFormData(prev => ({ ...prev, code: (maxNormal + 1).toString() }));
    }`;

page = page.replace(target, replacement);

fs.writeFileSync('src/app/clientes/page.tsx', page);
