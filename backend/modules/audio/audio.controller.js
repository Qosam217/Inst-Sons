const audioService = require('./audio.service');

const convertAudio = async (req, res, next) => {
  try {
    const file = req.file;
    const { format } = req.body;
    const result = await audioService.convertAudio(file, format);
    return res.status(200).json({
      success: true,
      message: 'Konversi audio berhasil diproses (placeholder)',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  convertAudio,
};
