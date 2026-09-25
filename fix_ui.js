const fs = require('fs');
let content = fs.readFileSync('src/app/tesoreria/page.tsx', 'utf-8');

// 1. Add handleDeleteTx
const deleteFn = `  const handleDeleteTx = async (tx: TreasuryTransaction) => {
    if (!confirm('¿Estás seguro de que querés eliminar este movimiento? Esto no se puede deshacer y devolverá los cheques a cartera o anulará pagos de sueldos si correspondiese.')) return;
    try {
      const res = await fetch(\`/api/tesoreria/\${tx.id}\`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert('Error al eliminar: ' + (errorData.error || 'Desconocido'));
      }
    } catch (error) {
      alert('Error de red al intentar eliminar.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {`;

content = content.replace('  const handleSaveEdit = async (e: React.FormEvent) => {', deleteFn);

// 2. Change 3 days to 5 days, and add Trash2 button next to Edit2
const oldBtn = `                          {t.createdAt && (new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24) <= 3 && (
                            <button 
                              onClick={() => setEditingTx(t)}
                              className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Editar (permitido por 3 días)"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}`;
// We have character encoding issues with "días" in powershell vs node? I'll use a regex that matches `d.*as`.
const btnRegex = /\{t\.createdAt && \(new Date\(\)\.getTime\(\) - new Date\(t\.createdAt\)\.getTime\(\)\) \/ \(1000 \* 3600 \* 24\) <= 3 && \([\s\S]*?<Edit2 size=\{14\} \/>\s*<\/button>\s*\)\}/;

const newBtn = `{t.createdAt && (new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24) <= 5 && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setEditingTx(t)}
                                className="text-gray-400 hover:text-indigo-600 p-1"
                                title="Editar (permitido por 5 días)"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTx(t)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Eliminar (permitido por 5 días)"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}`;

content = content.replace(btnRegex, newBtn);

fs.writeFileSync('src/app/tesoreria/page.tsx', content);
