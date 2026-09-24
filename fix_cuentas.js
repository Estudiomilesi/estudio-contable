
const fs = require('fs');
let code = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf-8');

code = code.replace('  const [isSubmittingQC, setIsSubmittingQC] = useState(false);', '  const [isSubmittingQC, setIsSubmittingQC] = useState(false);\n  const [isSubmittingApply, setIsSubmittingApply] = useState(false);');

code = code.replace('  const handleQuickCollectSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (selectedChargeIds.size === 0 || !selectedClientId) return;\n\n    setIsSubmittingQC(true);', '  const handleQuickCollectSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (selectedChargeIds.size === 0 || !selectedClientId) return;\n    if (isSubmittingQC) return;\n\n    setIsSubmittingQC(true);');

code = code.replace('  const handleApplySubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!applyingPayment) return;', '  const handleApplySubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!applyingPayment) return;\n    if (isSubmittingApply) return;\n\n    setIsSubmittingApply(true);');

code = code.replace('        console.error(error);\n      }\n    };', '        console.error(error);\n      } finally {\n        setIsSubmittingApply(false);\n      }\n    };');

code = code.replace(/<button\s*type="submit"\s*className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"\s*>\s*Confirmar Aplicacin\s*<\/button>/i, '<button type="submit" disabled={isSubmittingApply} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">{isSubmittingApply ? \'Aplicando...\' : \'Confirmar Aplicacin\'}</button>');

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', code);
