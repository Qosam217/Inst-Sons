const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfController = require('./pdf.controller');
const authMiddleware = require('../../core/auth.middleware');

// Terapkan auth middleware untuk seluruh route PDF
router.use(authMiddleware);

// Helper filter format PDF
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file format PDF yang diperbolehkan!'), false);
  }
};

// Konfigurasi Multer untuk Merge (Maks 10 MB per file, maks 5 files)
const uploadMerge = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
  fileFilter: pdfFileFilter,
});

// Konfigurasi Multer untuk Split (Maks 20 MB, 1 file)
const uploadSplit = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: pdfFileFilter,
});

const path = require('path');
const fs = require('fs');

const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Konfigurasi Multer untuk Compress (Maks 15 MB, 1 file disimpan di disk /temp)
const uploadCompress = multer({
  dest: tempDir,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1,
  },
  fileFilter: pdfFileFilter,
});

router.post('/merge', uploadMerge.array('files', 5), pdfController.mergePdf);
router.post('/split', uploadSplit.single('file'), pdfController.splitPdf);
router.post('/compress', uploadCompress.single('file'), pdfController.compressPdf);

module.exports = router;

