const pdfService = require('./pdf.service');

const mergePdf = async (req, res, next) => {
  try {
    const files = req.files;
    const result = await pdfService.mergePdfs(files);
    return res.status(200).json({
      success: true,
      message: 'PDF berhasil digabungkan (placeholder)',
      data: result,
    });
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
