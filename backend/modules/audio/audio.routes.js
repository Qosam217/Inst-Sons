const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const audioController = require('./audio.controller');
const authMiddleware = require('../../core/auth.middleware');

// Terapkan auth middleware untuk seluruh route Audio
router.use(authMiddleware);

// Pastikan direktori temp tersedia
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Konfigurasi Multer DiskStorage dengan penamaan berbasis UUID
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    cb(null, `audio-${uuidv4()}${ext}`);
  },
});

const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
    const ext = path.extname(file.originalname).toLowerCase();
    const isAudioMime = file.mimetype.startsWith('audio/') || file.mimetype === 'video/mp4' || file.mimetype === 'application/ogg';

    if (allowedExtensions.includes(ext) || isAudioMime) {
      cb(null, true);
    } else {
      const error = new Error('Hanya file format audio (mp3, wav, ogg, aac, flac, m4a) yang diperbolehkan.');
      error.statusCode = 400;
      cb(error, false);
    }
  },
});

// Definisi Rute
router.post('/convert', uploadAudio.single('file'), audioController.convertAudio);
router.get('/status/:taskId', audioController.getTaskStatus);
router.get('/download/:taskId', audioController.downloadAudio);

module.exports = router;
