const express = require('express');
const router = express.Router();
const multer = require('multer');
const imageController = require('./image.controller');

// Helper filter format gambar yang didukung
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
  ];
  const originalName = file.originalname ? file.originalname.toLowerCase() : '';
  const isAllowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].some(ext => originalName.endsWith(ext));

  if (allowedMimeTypes.includes(file.mimetype) || isAllowedExt) {
    cb(null, true);
  } else {
    const error = new Error('Hanya file format gambar (JPG, JPEG, PNG, WebP, AVIF, GIF) yang diperbolehkan!');
    error.statusCode = 400;
    cb(error, false);
  }
};

// Konfigurasi Multer untuk Convert (Maks 10 MB, 1 file, in-memory)
const uploadConvert = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
  fileFilter: imageFileFilter,
});

router.post('/convert', uploadConvert.single('file'), imageController.convertImage);
router.post('/compress', uploadConvert.single('file'), imageController.compressImage);

module.exports = router;
