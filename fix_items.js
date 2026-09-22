const fs = require('fs');
let code = fs.readFileSync('src/app/reportes/mes/ReportClient.tsx', 'utf-8');

const targetProcessedData = `  const processedData = useMemo(() => {
    let result = [...transacciones];
    
    // Si es Juanma, ya viene filtrado de backend, pero por las dudas forzamos
    if (isJuanma) {
      result = result.filter(t => t.client?.professionalLabel === 'FJ' || t.client?.professionalLabel === 'JF');
    } else if (filterLabel !== 'ALL') {
      if (filterLabel === 'FJ_JF') {
        result = result.filter(t => t.client?.professionalLabel === 'FJ' || t.client?.professionalLabel === 'JF');
      } else {
        result = result.filter(t => t.client?.professionalLabel === filterLabel);
      }
    }
    
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'client') {
          aVal = a.client?.name || '';
          bVal = b.client?.name || '';
        } else if (sortConfig.key === 'label') {
          aVal = a.client?.professionalLabel || '';
          bVal = b.client?.professionalLabel || '';
        } else if (sortConfig.key === 'caja') {
          aVal = getCaja(a.description || '');
          bVal = getCaja(b.description || '');
        } else if (sortConfig.key === 'concept') {
          aVal = getConcept(a.description || '');
          bVal = getConcept(b.description || '');
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [transacciones, sortConfig, filterLabel, isJuanma]);`;

const newProcessedData = `  const processedData = useMemo(() => {
    let result: any[] = [];
    
    transacciones.forEach(t => {
      // Filtrar por etiqueta
      let isValid = true;
      if (isJuanma) {
        if (t.client?.professionalLabel !== 'FJ' && t.client?.professionalLabel !== 'JF') isValid = false;
      } else if (filterLabel !== 'ALL') {
        if (filterLabel === 'FJ_JF') {
          if (t.client?.professionalLabel !== 'FJ' && t.client?.professionalLabel !== 'JF') isValid = false;
        } else {
          if (t.client?.professionalLabel !== filterLabel) isValid = false;
        }
      }
      
      if (!isValid) return;

      // Expandir items si existen (para desglosar facturas con mltiples conceptos)
      if (isFacturado && t.items && t.items.length > 0) {
        t.items.forEach((item: any) => {
          result.push({
            ...t,
            id: item.id, // Usar el ID del item para que sea nico en la tabla
            conceptFromItem: item.concept,
            amount: item.amount,
            netAmount: item.amount, // Los items manuales no tienen IVA desglosado en la DB por item an
            ivaAmount: 0
          });
        });
      } else {
        result.push(t);
      }
    });
    
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'client') {
          aVal = a.client?.name || '';
          bVal = b.client?.name || '';
        } else if (sortConfig.key === 'label') {
          aVal = a.client?.professionalLabel || '';
          bVal = b.client?.professionalLabel || '';
        } else if (sortConfig.key === 'caja') {
          aVal = getCaja(a.description || '');
          bVal = getCaja(b.description || '');
        } else if (sortConfig.key === 'concept') {
          aVal = a.conceptFromItem || getConcept(a.description || '');
          bVal = b.conceptFromItem || getConcept(b.description || '');
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [transacciones, sortConfig, filterLabel, isJuanma, isFacturado]);`;

code = code.replace(targetProcessedData, newProcessedData);

// Update groupedByConcept to use conceptFromItem
const groupedTarget = `  const groupedByConcept = useMemo(() => {
    const map = new Map<string, { count: number, net: number, iva: number, total: number }>();
    processedData.forEach(t => {
      const concept = getConcept(t.description);`;
      
const groupedNew = `  const groupedByConcept = useMemo(() => {
    const map = new Map<string, { count: number, net: number, iva: number, total: number }>();
    processedData.forEach(t => {
      const concept = t.conceptFromItem || getConcept(t.description);`;
      
code = code.replace(groupedTarget, groupedNew);

// Update Detailed view to use conceptFromItem
const detailedTarget = `                      {isFacturado && (
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 font-medium">
                          {getConcept(t.description || '')}
                        </td>
                      )}`;

const detailedNew = `                      {isFacturado && (
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 font-medium">
                          {t.conceptFromItem || getConcept(t.description || '')}
                        </td>
                      )}`;
                      
code = code.replace(detailedTarget, detailedNew);

fs.writeFileSync('src/app/reportes/mes/ReportClient.tsx', code);
