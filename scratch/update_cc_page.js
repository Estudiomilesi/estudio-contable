const fs = require('fs');

let c = fs.readFileSync('src/app/cuentas-corrientes/page.tsx', 'utf8');

c = c.replace(
  "import { Search, FileText, Download, DollarSign, Send, ArrowDownToLine, Calculator, Check, CheckSquare, Square, FileEdit, Trash2, Mail } from 'lucide-react';",
  "import { Search, FileText, Download, DollarSign, Send, ArrowDownToLine, Calculator, Check, CheckSquare, Square, FileEdit, Trash2, Mail, MessageSquare } from 'lucide-react';\nimport ClientNotesModal from '@/components/ClientNotesModal';"
);

c = c.replace(
  "const [isQuickCollectOpen, setIsQuickCollectOpen] = useState(false);",
  "const [isQuickCollectOpen, setIsQuickCollectOpen] = useState(false);\n  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);"
);

c = c.replace(
  `<button
                    onClick={() => setIsReportMode(true)}`,
  `<button
                    onClick={() => setIsNotesModalOpen(true)}
                    className="flex items-center gap-2 rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline">Seguimiento</span>
                  </button>
                  <button
                    onClick={() => setIsReportMode(true)}`
);

c = c.replace(
  `{isQuickCollectOpen && selectedClient && (`,
  `{isNotesModalOpen && selectedClient && (
          <ClientNotesModal 
            client={selectedClient} 
            onClose={() => setIsNotesModalOpen(false)} 
          />
        )}

        {isQuickCollectOpen && selectedClient && (`
);

fs.writeFileSync('src/app/cuentas-corrientes/page.tsx', c);
