const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const imageController = require('./image.controller');

const upload = multer({
  dest: path.join(__dirname, '../../temp'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

router.post('/compress', upload.single('file'), imageController.compressImage);
router.post('/convert', upload.single('file'), imageController.convertImage);

module.exports = router;
