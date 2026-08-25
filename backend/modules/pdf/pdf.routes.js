const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfController = require('./pdf.controller');

// Konfigurasi Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Maksimal 10 MB per file
    files: 5, // Maksimal 5 file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file format PDF yang diperbolehkan!'), false);
    }
  },
});

router.post('/merge', upload.array('files', 5), pdfController.mergePdf);
router.post('/split', upload.single('file'), pdfController.splitPdf);

module.exports = router;

