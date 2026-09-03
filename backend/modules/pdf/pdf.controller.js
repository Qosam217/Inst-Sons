const pdfService = require('./pdf.service');

const mergePdf = async (req, res, next) => {
  try {
    const files = req.files;

    // 1. Validasi keberadaan file dan jumlah minimal (2 file)
    if (!files || files.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Minimal 2 file PDF diperlukan untuk digabungkan.',
      });
    }

    // 2. Validasi jumlah maksimal (5 file)
    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maksimal 5 file PDF yang diperbolehkan untuk digabungkan.',
      });
    }

    // 3. Validasi total ukuran semua file (maksimal 30 MB)
    const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30 MB
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > MAX_TOTAL_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Total ukuran semua file melebihi batas maksimal 30 MB.',
      });
    }

    // 4. Proses penggabungan PDF
    const mergedPdfBytes = await pdfService.mergePdfs(files);

    // 5. Kembalikan response file PDF hasil gabungan
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
    return res.send(Buffer.from(mergedPdfBytes));
  } catch (error) {
    next(error);
  }
};

const splitPdf = async (req, res, next) => {
  try {
    const file = req.file;

    // 1. Validasi keberadaan file
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File PDF wajib diunggah.',
      });
    }

    // 2. Validasi ukuran file PDF (maksimal 15 MB)
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file PDF melebihi batas maksimal 15 MB.',
      });
    }

    // 3. Validasi nomor halaman
    const startPage = parseInt(req.body.startPage, 10);
    const endPage = parseInt(req.body.endPage, 10);

    if (isNaN(startPage) || isNaN(endPage) || startPage < 1 || endPage < 1) {
      return res.status(400).json({
        success: false,
        message: 'Nomor halaman startPage dan endPage harus berupa bilangan bulat positif (minimal 1).',
      });
    }

    if (startPage > endPage) {
      return res.status(400).json({
        success: false,
        message: 'Nilai startPage tidak boleh lebih besar dari endPage.',
      });
    }

    // 4. Proses pemisahan PDF
    const splitPdfBytes = await pdfService.splitPdf(file.buffer, startPage, endPage);

    // 5. Kembalikan response file PDF hasil split
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="split.pdf"');
    return res.send(Buffer.from(splitPdfBytes));
  } catch (error) {
    next(error);
  }
};

const fs = require('fs');

// Helper cleanup file
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Gagal menghapus file ${filePath}:`, err);
      }
    });
  }
};

const compressPdf = async (req, res, next) => {
  const file = req.file;
  try {
    // 1. Validasi keberadaan file
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File PDF wajib diunggah.',
      });
    }

    // 2. Validasi ukuran file PDF (maksimal 15 MB)
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
    if (file.size > MAX_FILE_SIZE) {
      cleanupFile(file.path);
      return res.status(400).json({
        success: false,
        message: 'Ukuran file PDF melebihi batas maksimal 15 MB.',
      });
    }

    // 3. Validasi level kompresi
    const validLevels = ['low', 'medium', 'high'];
    const level = req.body.level || 'medium';
    if (req.body.level && !validLevels.includes(req.body.level)) {
      cleanupFile(file.path);
      return res.status(400).json({
        success: false,
        message: 'Level kompresi tidak valid. Pilihan yang tersedia: low, medium, high.',
      });
    }

    // 4. Proses kompresi file via Ghostscript
    const outputPath = await pdfService.compressPdf(file.path, level);

    // 5. Kirim file hasil kompresi dan cleanup kedua file setelah selesai
    return res.download(outputPath, 'compressed.pdf', (err) => {
      cleanupFile(file.path);
      cleanupFile(outputPath);
      if (err && !res.headersSent) {
        return next(err);
      }
    });
  } catch (error) {
    if (file && file.path) {
      cleanupFile(file.path);
    }
    next(error);
  }
};

module.exports = {
  mergePdf,
  splitPdf,
  compressPdf,
};

