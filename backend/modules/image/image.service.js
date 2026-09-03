const sharp = require('sharp');

const MAX_RESOLUTION = 8192;

const FORMAT_MAPPING = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
};

const compressImage = async (file, quality = 80) => {
  return {
    status: 'ready',
    fileName: file ? file.originalname : null,
    quality: Number(quality),
    action: 'compress',
  };
};

const convertImage = async (fileBuffer, format) => {
  const normalizedFormat = (format || '').toLowerCase().trim();
  const sharpFormat = FORMAT_MAPPING[normalizedFormat];

  if (!sharpFormat) {
    const error = new Error('Format target tidak valid. Format yang didukung: jpg, jpeg, png, webp, avif, gif.');
    error.statusCode = 400;
    throw error;
  }

  // Ambil metadata gambar untuk validasi batas resolusi
  const metadata = await sharp(fileBuffer).metadata();
  if (metadata.width > MAX_RESOLUTION || metadata.height > MAX_RESOLUTION) {
    const error = new Error(`Resolusi gambar melebihi batas maksimal ${MAX_RESOLUTION} x ${MAX_RESOLUTION} piksel.`);
    error.statusCode = 400;
    throw error;
  }

  // Proses konversi gambar menggunakan Sharp ke format target
  const outputBuffer = await sharp(fileBuffer)
    .toFormat(sharpFormat)
    .toBuffer();

  return outputBuffer;
};

module.exports = {
  compressImage,
  convertImage,
};
