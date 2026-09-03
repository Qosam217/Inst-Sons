const imageService = require('./image.service');

const MAX_CONVERT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_COMPRESS_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

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

    // 1. Validasi keberadaan file
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File gambar wajib diunggah.',
      });
    }

    // 2. Validasi ukuran file gambar (maksimal 15 MB)
    if (file.size > MAX_COMPRESS_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file gambar melebihi batas maksimal 15 MB.',
      });
    }

    // 3. Validasi level kompresi (low, medium, high - default: medium)
    const { level } = req.body;
    let selectedLevel = 'medium';

    if (level !== undefined && level !== null && String(level).trim() !== '') {
      const normalizedLevel = String(level).toLowerCase().trim();
      const validLevels = ['low', 'medium', 'high'];
      if (!validLevels.includes(normalizedLevel)) {
        return res.status(400).json({
          success: false,
          message: 'Level kompresi tidak valid. Pilihan yang tersedia: low, medium, high.',
        });
      }
      selectedLevel = normalizedLevel;
    }

    // 4. Proses kompresi gambar via service
    const { buffer: outputBuffer, format } = await imageService.compressImage(file.buffer, selectedLevel);

    // 5. Kembalikan response buffer gambar hasil kompresi
    const mimeType = MIME_TYPES[format] || file.mimetype || 'image/jpeg';
    const extension = format === 'jpeg' ? 'jpg' : (format || 'jpg');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="compressed.${extension}"`);
    return res.send(outputBuffer);
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
    if (file.size > MAX_CONVERT_FILE_SIZE) {
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
