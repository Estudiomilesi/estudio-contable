const fs = require('fs');

const filesToPatch = [
  'src/app/api/comprobantes/enviar-html/route.ts',
  'src/app/api/comprobantes/[id]/adjuntar-afip/route.ts',
  'src/app/api/facturacion/procesar/route.ts'
];

const newColors = `const colorPrincipal = '#7C4751'; 
      const colorFondoEtiqueta = '#F5ECE7';
      const colorTextoEtiqueta = '#55434F';`;

filesToPatch.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Regex to catch the different variations of color declarations
    content = content.replace(/const colorPrincipal\s*=\s*[^;]+;/g, "const colorPrincipal = '#7C4751';");
    content = content.replace(/const colorFondoEtiqueta\s*=\s*[^;]+;/g, "const colorFondoEtiqueta = '#F5ECE7';");
    content = content.replace(/const colorTextoEtiqueta\s*=\s*[^;]+;/g, "const colorTextoEtiqueta = '#55434F';");
    
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
});

const reportFile = 'src/app/api/cuentas-corrientes/enviar-reporte/route.ts';
if (fs.existsSync(reportFile)) {
  let content = fs.readFileSync(reportFile, 'utf8');
  content = content.replace(/const colorPrincipal\s*=\s*[^;]+;/g, "const colorPrincipal = '#7C4751';");
  content = content.replace(/const colorSecundario\s*=\s*[^;]+;/g, "const colorSecundario = '#F5ECE7';");
  fs.writeFileSync(reportFile, content);
  console.log('Patched', reportFile);
}
