const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

const mergePdfs = async (files) => {
  // 1. Buat dokumen PDF baru
  const mergedPdf = await PDFDocument.create();

  // 2. Iterasi setiap file dan salin seluruh halamannya
  for (const file of files) {
    let fileBuffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else if (file.path) {
      fileBuffer = fs.readFileSync(file.path);
    } else {
      continue;
    }

    const pdfDoc = await PDFDocument.load(fileBuffer);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  // 3. Simpan dan kembalikan Uint8Array buffer
  const mergedPdfBytes = await mergedPdf.save();
  return mergedPdfBytes;
};

const splitPdf = async (file, pages) => {
  // Scaffolding placeholder: logika implementasi split pdf-lib
  return {
    status: 'ready',
    fileName: file ? file.originalname : null,
    pages,
    action: 'split',
  };
};

module.exports = {
  mergePdfs,
  splitPdf,
};

