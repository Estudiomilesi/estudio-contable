const fs = require('fs');
const PDFParser = require("pdf2json");

async function test() {
    const pdfParser = new PDFParser(this, 1);
    
    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
    pdfParser.on("pdfParser_dataReady", pdfData => {
        console.log("Extracted:", pdfParser.getRawTextContent().substring(0, 500));
    });

    // Create a dummy PDF buffer
    // Actually, I don't have a PDF to test. I'll just check if it compiles.
}

test();
