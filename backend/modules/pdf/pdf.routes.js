// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const pdfController = require('./pdf.controller');

// const upload = multer({
//   dest: path.join(__dirname, '../../temp'),
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
// });

// router.post('/merge', upload.array('files', 10), pdfController.mergePdf);
// router.post('/split', upload.single('file'), pdfController.splitPdf);

// module.exports = router;
