const fs = require('fs');

let code = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf-8');

// Add isSubmittingApply
const qcStateTarget = `  const [isSubmittingQC, setIsSubmittingQC] = useState(false);`;
const qcStateNew = `  const [isSubmittingQC, setIsSubmittingQC] = useState(false);
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);`;
code = code.replace(qcStateTarget, qcStateNew);

// Add guard to handleQuickCollectSubmit
const handleQCTarget = `  const handleQuickCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChargeIds.size === 0 || !selectedClientId) return;

    setIsSubmittingQC(true);`;
const handleQCNew = `  const handleQuickCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChargeIds.size === 0 || !selectedClientId) return;
    if (isSubmittingQC) return;

    setIsSubmittingQC(true);`;
code = code.replace(handleQCTarget, handleQCNew);

// Add guard to handleApplySubmit
const handleApplyTarget = `  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingPayment) return;`;
const handleApplyNew = `  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingPayment) return;
    if (isSubmittingApply) return;

    setIsSubmittingApply(true);`;
code = code.replace(handleApplyTarget, handleApplyNew);

// Turn off isSubmittingApply in handleApplySubmit
const handleApplyCatchTarget = `        console.error(error);
    }
  };`;
const handleApplyCatchNew = `        console.error(error);
    } finally {
      setIsSubmittingApply(false);
    }
  };`;
code = code.replace(handleApplyCatchTarget, handleApplyCatchNew);

// Update button for apply
const applyBtnTarget = `                  <button 
                    type="submit" 
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Confirmar Aplicacin
                  </button>`;
const applyBtnNew = `                  <button 
                    type="submit" 
                    disabled={isSubmittingApply}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmittingApply ? 'Aplicando...' : 'Confirmar Aplicacin'}
                  </button>`;
// Because of the encoding issue with 'Aplicacin', I'll use a regex replacement to be safe.

fs.writeFileSync('fix_cuentas.js', `
const fs = require('fs');
let code = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf-8');

code = code.replace('  const [isSubmittingQC, setIsSubmittingQC] = useState(false);', '  const [isSubmittingQC, setIsSubmittingQC] = useState(false);\\n  const [isSubmittingApply, setIsSubmittingApply] = useState(false);');

code = code.replace('  const handleQuickCollectSubmit = async (e: React.FormEvent) => {\\n    e.preventDefault();\\n    if (selectedChargeIds.size === 0 || !selectedClientId) return;\\n\\n    setIsSubmittingQC(true);', '  const handleQuickCollectSubmit = async (e: React.FormEvent) => {\\n    e.preventDefault();\\n    if (selectedChargeIds.size === 0 || !selectedClientId) return;\\n    if (isSubmittingQC) return;\\n\\n    setIsSubmittingQC(true);');

code = code.replace('  const handleApplySubmit = async (e: React.FormEvent) => {\\n    e.preventDefault();\\n    if (!applyingPayment) return;', '  const handleApplySubmit = async (e: React.FormEvent) => {\\n    e.preventDefault();\\n    if (!applyingPayment) return;\\n    if (isSubmittingApply) return;\\n\\n    setIsSubmittingApply(true);');

code = code.replace('        console.error(error);\\n      }\\n    };', '        console.error(error);\\n      } finally {\\n        setIsSubmittingApply(false);\\n      }\\n    };');

code = code.replace(/<button\\s*type="submit"\\s*className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"\\s*>\\s*Confirmar Aplicacin\\s*<\\/button>/i, '<button type="submit" disabled={isSubmittingApply} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">{isSubmittingApply ? \\'Aplicando...\\' : \\'Confirmar Aplicacin\\'}</button>');

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', code);
`);
