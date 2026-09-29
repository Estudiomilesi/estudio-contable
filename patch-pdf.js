const fs = require('fs');

let route = fs.readFileSync('src/app/api/comprobantes/importar/pdf/route.ts', 'utf-8');

const targetStr = `      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;`;

const replacementStr = `      let text = '';
      try {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (error: any) {
        if (error?.message && (error.message.includes('bad XRef entry') || error.message.includes('Invalid PDF structure'))) {
          console.log('pdf-parse failed with bad XRef entry. Trying pdf2json fallback...');
          const PDFParser = require('pdf2json');
          text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, 1);
            pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
            pdfParser.parseBuffer(buffer);
          });
        } else {
          throw error;
        }
      }`;

route = route.replace(targetStr, replacementStr);

fs.writeFileSync('src/app/api/comprobantes/importar/pdf/route.ts', route);
