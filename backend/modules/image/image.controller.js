const imageService = require('./image.service');

const compressImage = async (req, res, next) => {
  try {
    const file = req.file;
    const { quality } = req.body;
    const result = await imageService.compressImage(file, quality);
    return res.status(200).json({
      success: true,
      message: 'Kompresi gambar berhasil diproses (placeholder)',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const convertImage = async (req, res, next) => {
  try {
    const file = req.file;
    const { format } = req.body;
    const result = await imageService.convertImage(file, format);
    return res.status(200).json({
      success: true,
      message: 'Konversi format gambar berhasil diproses (placeholder)',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  compressImage,
  convertImage,
};
