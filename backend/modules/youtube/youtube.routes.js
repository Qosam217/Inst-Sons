const express = require('express');
const router = express.Router();
const youtubeController = require('./youtube.controller');
const authMiddleware = require('../../core/auth.middleware');

// Terapkan auth middleware untuk seluruh route YouTube
router.use(authMiddleware);

router.post('/download-audio', youtubeController.requestAudioDownload);
router.get('/status/:taskId', youtubeController.getTaskStatus);
router.get('/download/:taskId', youtubeController.downloadAudioFile);

module.exports = router;
