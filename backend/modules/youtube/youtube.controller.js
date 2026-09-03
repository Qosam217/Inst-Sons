const fs = require('fs');
const youtubeService = require('./youtube.service');

/**
 * Endpoint 1: Request Download Audio dari YouTube
 * POST /api/youtube/download-audio
 */
const requestAudioDownload = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'URL YouTube wajib disertakan.',
      });
    }

    const result = youtubeService.createAudioTask(url.trim());

    return res.status(202).json({
      success: true,
      message: 'Permintaan unduh audio berhasil diterima dan sedang diproses.',
      data: {
        task_id: result.taskId,
        status: result.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint 2: Cek Status Task (Polling)
 * GET /api/youtube/status/:taskId
 */
const getTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = youtubeService.getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task ID '${taskId}' tidak ditemukan.`,
      });
    }

    if (task.status === 'processing') {
      return res.status(200).json({
        success: true,
        data: {
          task_id: task.taskId,
          status: 'processing',
        },
      });
    }

    if (task.status === 'completed') {
      return res.status(200).json({
        success: true,
        data: {
          task_id: task.taskId,
          status: 'completed',
          title: task.title,
          duration: task.duration,
          download_url: `/api/youtube/download/${task.taskId}`,
        },
      });
    }

    // task.status === 'failed'
    return res.status(200).json({
      success: false,
      data: {
        task_id: task.taskId,
        status: 'failed',
        error: task.error || 'Terjadi kesalahan saat memproses audio.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint 3: Unduh File Hasil Ekstraksi MP3
 * GET /api/youtube/download/:taskId
 */
const downloadAudioFile = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = youtubeService.getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task ID '${taskId}' tidak ditemukan.`,
      });
    }

    if (task.status === 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Proses unduh audio masih berjalan. Silakan coba beberapa saat lagi.',
      });
    }

    if (task.status === 'failed' || !task.outputPath || !fs.existsSync(task.outputPath)) {
      return res.status(400).json({
        success: false,
        message: task.error || 'File audio hasil ekstraksi tidak ditemukan atau gagal diproses.',
      });
    }

    // Sanitasi nama file download dari karakter ilegal
    const safeTitle = (task.title || 'audio').replace(/[/\\?%*:|"<>]/g, '_');
    const downloadFileName = `${safeTitle}.mp3`;

    res.download(task.outputPath, downloadFileName, (err) => {
      if (err) {
        console.error(`[YouTube Controller] Error saat download file ${taskId}:`, err.message);
      }
      // CLEANUP CRITICAL: Hapus file fisik dan bersihkan task store
      youtubeService.cleanupTaskFile(taskId);
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestAudioDownload,
  getTaskStatus,
  downloadAudioFile,
};
