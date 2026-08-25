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
    const { pages } = req.body;
    const result = await pdfService.splitPdf(file, pages);
    return res.status(200).json({
      success: true,
      message: 'PDF berhasil dipisahkan (placeholder)',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  mergePdf,
  splitPdf,
};

