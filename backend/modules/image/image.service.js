const sharp = require('sharp');

const MAX_CONVERT_RESOLUTION = 8192;
const MAX_COMPRESS_RESOLUTION = 8000;

const FORMAT_MAPPING = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
};

const compressImage = async (fileBuffer, level = 'medium') => {
  const normalizedLevel = (level || 'medium').toLowerCase().trim();

  // Ambil metadata gambar untuk validasi batas resolusi & format asli
  const metadata = await sharp(fileBuffer).metadata();
  if (metadata.width > MAX_COMPRESS_RESOLUTION || metadata.height > MAX_COMPRESS_RESOLUTION) {
    const error = new Error(`Resolusi gambar melebihi batas maksimal ${MAX_COMPRESS_RESOLUTION} x ${MAX_COMPRESS_RESOLUTION} piksel.`);
    error.statusCode = 400;
    throw error;
  }

  let pipeline = sharp(fileBuffer);

  // Konfigurasi berdasarkan level kompresi
  let targetQuality = 60;
  if (normalizedLevel === 'low') {
    targetQuality = 80;
    // Low: tanpa resize
  } else if (normalizedLevel === 'high') {
    targetQuality = 40;
    pipeline = pipeline.resize({ width: 1080, withoutEnlargement: true });
  } else {
    // Default / Medium: width 1920, quality 60
    targetQuality = 60;
    pipeline = pipeline.resize({ width: 1920, withoutEnlargement: true });
  }

  // Tentukan format output sesuai format input gambar
  const format = metadata.format || 'jpeg';
  if (format === 'jpeg' || format === 'jpg') {
    pipeline = pipeline.jpeg({ quality: targetQuality });
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality: targetQuality });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality: targetQuality });
  } else if (format === 'avif') {
    pipeline = pipeline.avif({ quality: targetQuality });
  } else if (format === 'gif') {
    pipeline = pipeline.gif();
  } else {
    pipeline = pipeline.toFormat(format, { quality: targetQuality });
  }

  const outputBuffer = await pipeline.toBuffer();

  return {
    buffer: outputBuffer,
    format,
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
  if (metadata.width > MAX_CONVERT_RESOLUTION || metadata.height > MAX_CONVERT_RESOLUTION) {
    const error = new Error(`Resolusi gambar melebihi batas maksimal ${MAX_CONVERT_RESOLUTION} x ${MAX_CONVERT_RESOLUTION} piksel.`);
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
