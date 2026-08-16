const { PDFDocument } = require('pdf-lib');

const mergePdfs = async (files) => {
  // Scaffolding placeholder: logika implementasi pdf-lib
  return {
    status: 'ready',
    filesCount: files ? files.length : 0,
    action: 'merge',
  };
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
