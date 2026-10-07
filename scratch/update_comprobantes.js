const fs = require('fs');
let c = fs.readFileSync('src/app/comprobantes/page.tsx', 'utf8');

c = c.replace(
  `  const [paymentConditions, setPaymentConditions] = useState<any[]>([]);`,
  `  const [paymentConditions, setPaymentConditions] = useState<any[]>([]);\n  const [empleados, setEmpleados] = useState<any[]>([]);`
);

c = c.replace(
  `      const [resCli, resComp, resConcepts, resBancos, resPC] = await Promise.all([\n        fetch('/api/clientes'),\n        fetch('/api/comprobantes'),\n        fetch('/api/conceptos'),\n        fetch('/api/bancos'),\n        fetch('/api/configuracion/payment-conditions')\n      ]);`,
  `      const [resCli, resComp, resConcepts, resBancos, resPC, resEmp] = await Promise.all([\n        fetch('/api/clientes'),\n        fetch('/api/comprobantes'),\n        fetch('/api/conceptos'),\n        fetch('/api/bancos'),\n        fetch('/api/configuracion/payment-conditions'),\n        fetch('/api/empleados')\n      ]);`
);

c = c.replace(
  `      const dataPC = await resPC.json();\n      setClientes(dataCli);`,
  `      const dataPC = await resPC.json();\n      const dataEmp = await resEmp.json();\n      setEmpleados(dataEmp);\n      setClientes(dataCli);`
);

c = c.replace(
  `<input 
                        type="text" 
                        placeholder="Nombre del colaborador" 
                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={form.collaboratorName}
                        onChange={e => setForm({...form, collaboratorName: e.target.value})}
                      />`,
  `<select 
                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={form.collaboratorName}
                        onChange={e => setForm({...form, collaboratorName: e.target.value})}
                      >
                        <option value="">Seleccionar colaborador...</option>
                        {empleados.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                      </select>`
);

fs.writeFileSync('src/app/comprobantes/page.tsx', c);
