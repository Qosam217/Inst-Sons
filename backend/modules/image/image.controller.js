const imageService = require('./image.service');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

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

    // 1. Validasi keberadaan file
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File gambar wajib diunggah.',
      });
    }

    // 2. Validasi ukuran file gambar (maksimal 10 MB)
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file gambar melebihi batas maksimal 10 MB.',
      });
    }

    // 3. Validasi format target
    const { format } = req.body;
    if (!format || typeof format !== 'string' || !format.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Format target konversi wajib diisi.',
      });
    }

    const validFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
    const normalizedFormat = format.toLowerCase().trim();

    if (!validFormats.includes(normalizedFormat)) {
      return res.status(400).json({
        success: false,
        message: 'Format target tidak valid. Format yang didukung: jpg, jpeg, png, webp, avif, gif.',
      });
    }

    // 4. Proses konversi gambar via service
    const outputBuffer = await imageService.convertImage(file.buffer, normalizedFormat);

    // 5. Kembalikan response buffer gambar hasil konversi
    const mimeType = MIME_TYPES[normalizedFormat] || 'application/octet-stream';
    const extension = normalizedFormat === 'jpeg' ? 'jpg' : normalizedFormat;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="converted.${extension}"`);
    return res.send(outputBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  compressImage,
  convertImage,
};
