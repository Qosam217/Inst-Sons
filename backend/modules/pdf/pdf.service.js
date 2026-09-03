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

const splitPdf = async (fileBuffer, startPage, endPage) => {
  // 1. Muat dokumen PDF dari buffer
  const pdfDoc = await PDFDocument.load(fileBuffer);

  // 2. Validasi jumlah halaman dokumen
  const totalPages = pdfDoc.getPageCount();
  if (totalPages > 500) {
    const error = new Error(`Dokumen PDF melebihi batas maksimal 500 halaman (total: ${totalPages} halaman).`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Validasi batasan rentang halaman
  if (startPage > totalPages || endPage > totalPages) {
    const error = new Error(`Rentang halaman tidak valid: Halaman melebihi total halaman PDF (total ${totalPages} halaman).`);
    error.statusCode = 400;
    throw error;
  }

  // 4. Buat dokumen PDF baru dan salin halaman yang diminta
  const newPdf = await PDFDocument.create();
  const pageIndices = [];
  for (let i = startPage - 1; i <= endPage - 1; i++) {
    pageIndices.push(i);
  }

  const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  // 5. Simpan dan kembalikan Uint8Array buffer
  const splitPdfBytes = await newPdf.save();
  return splitPdfBytes;
};

const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

const PDF_SETTINGS_MAP = {
  low: '/printer',
  medium: '/ebook',
  high: '/screen',
};

const compressPdf = async (inputFilePath, level = 'medium') => {
  const pdfSetting = PDF_SETTINGS_MAP[level] || '/ebook';
  const outputFileName = `compressed-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
  const outputPath = path.join(path.dirname(inputFilePath), outputFileName);

  const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${pdfSetting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputFilePath}"`;

  try {
    await execPromise(command);
    return outputPath;
  } catch (error) {
    // Jika output sempat terbuat namun terjadi error, bersihkan
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw error;
  }
};

module.exports = {
  mergePdfs,
  splitPdf,
  compressPdf,
};

