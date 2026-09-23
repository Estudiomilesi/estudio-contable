const fs = require('fs');
let code = fs.readFileSync('src/app/publico/asignaciones/ClientDirectory.tsx', 'utf-8');

// 1. Add searchTerm state
const stateTarget = `  const [filterCollaborator, setFilterCollaborator] = useState<string>('ALL');`;
const stateNew = `  const [filterCollaborator, setFilterCollaborator] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');`;
code = code.replace(stateTarget, stateNew);

// 2. Update filteredAndSortedClients to include search logic
const filterTarget = `  const filteredAndSortedClients = useMemo(() => {
    let sortableClients = [...clients];

    if (filterCollaborator !== 'ALL') {`;
const filterNew = `  const filteredAndSortedClients = useMemo(() => {
    let sortableClients = [...clients];

    if (searchTerm && searchTerm.length >= 3) {
      const lowerSearch = searchTerm.toLowerCase();
      sortableClients = sortableClients.filter(c => 
        (c.name?.toLowerCase().includes(lowerSearch) || false) || 
        (c.code?.toLowerCase().includes(lowerSearch) || false)
      );
    }

    if (filterCollaborator !== 'ALL') {`;
code = code.replace(filterTarget, filterNew);

// 3. Add searchTerm to useMemo dependencies
const depsTarget = `  }, [clients, filterCollaborator, sortConfig]);`;
const depsNew = `  }, [clients, filterCollaborator, sortConfig, searchTerm]);`;
code = code.replace(depsTarget, depsNew);

// 4. Shrink the blue header
const headerTarget = `          <div className="bg-indigo-600 px-6 py-4 shrink-0 shadow-md z-20">
            <h1 className="text-2xl font-bold text-white">Directorio de Asignaciones</h1>
            <p className="text-indigo-100 text-sm mt-1">
              Listado de clientes activos y sus colaboradores asignados.
            </p>
          </div>`;
const headerNew = `          <div className="bg-indigo-600 px-4 py-2 shrink-0 shadow-md z-20 flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-white">Directorio de Asignaciones</h1>
              <p className="text-indigo-100 text-xs mt-0.5">
                Listado de clientes activos y sus colaboradores asignados.
              </p>
            </div>
          </div>`;
code = code.replace(headerTarget, headerNew);

// 5. Update the "Nombre del Cliente" table header
const thTarget = `                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 select-none transition-colors border-r border-gray-200/50"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center justify-between">
                      Nombre del Cliente
                      {sortConfig?.key === 'name' && (<span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                    </div>
                  </th>`;
const thNew = `                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200/50"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('name')}>
                        Nombre del Cliente
                        {sortConfig?.key === 'name' && (<span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                      </div>
                      <div className="relative w-full">
                        <input 
                          type="text" 
                          placeholder="Buscar (min 3 letras)..." 
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full text-xs font-normal border-gray-300 rounded p-1 pl-6 focus:ring-indigo-500 shadow-sm"
                        />
                        <svg className="w-3 h-3 text-gray-400 absolute left-2 top-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </th>`;
code = code.replace(thTarget, thNew);

fs.writeFileSync('src/app/publico/asignaciones/ClientDirectory.tsx', code);
