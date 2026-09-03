const fs = require('fs');
const path = require('path');
const audioService = require('./audio.service');

const ALLOWED_TARGET_FORMATS = ['mp3', 'wav', 'aac', 'ogg', 'flac'];

/**
 * Handler untuk mengunggah file audio dan memulai task konversi
 */
const convertAudio = async (req, res, next) => {
  try {
    const file = req.file;
    const { format } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File audio wajib diunggah.',
      });
    }

    if (!format) {
      // Hapus file fisik yang sempat terunggah
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'Format target konversi wajib diisi.',
      });
    }

    const normalizedFormat = format.toLowerCase().trim();
    if (!ALLOWED_TARGET_FORMATS.includes(normalizedFormat)) {
      // Hapus file fisik yang sempat terunggah
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: `Format target tidak valid. Format yang didukung: ${ALLOWED_TARGET_FORMATS.join(', ')}.`,
      });
    }

    const result = audioService.createConversionTask(file, normalizedFormat);

    return res.status(202).json({
      success: true,
      message: 'Task konversi audio berhasil dibuat dan sedang diproses.',
      data: {
        task_id: result.taskId,
        status: result.status,
        target_format: result.targetFormat,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Handler untuk polling status task konversi
 */
const getTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = audioService.getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task konversi dengan ID tersebut tidak ditemukan.',
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
          download_url: `/api/audio/download/${task.taskId}`,
        },
      });
    }

    // Status 'failed'
    return res.status(200).json({
      success: false,
      data: {
        task_id: task.taskId,
        status: 'failed',
        error: task.error || 'Konversi audio gagal diproses.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handler untuk mengunduh hasil konversi & cleanup file sementara
 */
const downloadAudio = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = audioService.getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task konversi dengan ID tersebut tidak ditemukan.',
      });
    }

    if (task.status === 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Proses konversi audio masih berjalan. Silakan tunggu hingga status completed.',
      });
    }

    if (task.status === 'failed') {
      return res.status(400).json({
        success: false,
        message: task.error || 'Proses konversi audio gagal.',
      });
    }

    if (!task.outputPath || !fs.existsSync(task.outputPath)) {
      return res.status(404).json({
        success: false,
        message: 'File hasil konversi tidak ditemukan atau sudah dibersihkan dari server.',
      });
    }

    const baseOriginalName = path.parse(task.originalName || 'audio').name;
    const downloadFilename = `converted-${baseOriginalName}.${task.targetFormat}`;

    // Kirim file ke klien dan bersihkan file fisik di callback
    res.download(task.outputPath, downloadFilename, (err) => {
      if (err) {
        console.error('[Audio Controller] Error saat mengirim download:', err.message);
      }
      // Hapus file input dan output dari folder /temp
      audioService.cleanupTaskFiles(taskId);
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  convertAudio,
  getTaskStatus,
  downloadAudio,
};
