const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');

// Penyimpanan status task (In-Memory Store)
const taskStore = new Map();

// Helper untuk membersihkan file fisik
const removeFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`[Audio Service] Gagal menghapus file ${filePath}:`, err.message);
    });
  }
};

/**
 * Memulai task konversi audio di background
 * @param {Object} file - File object dari Multer
 * @param {string} targetFormat - Format target ('mp3', 'wav', 'aac', 'ogg', 'flac')
 * @returns {Object} { taskId, status, targetFormat }
 */
const createConversionTask = (file, targetFormat) => {
  const taskId = uuidv4();
  const tempDir = path.join(__dirname, '../../temp');
  const outputPath = path.join(tempDir, `converted-${taskId}.${targetFormat}`);

  const taskData = {
    taskId,
    status: 'processing',
    targetFormat,
    originalName: file.originalname,
    inputPath: file.path,
    outputPath,
    fileSizeIn: file.size,
    error: null,
    createdAt: new Date(),
  };

  taskStore.set(taskId, taskData);

  // Jalankan konversi secara background (tanpa di-await)
  processAudioConversion(taskId);

  return {
    taskId,
    status: 'processing',
    targetFormat,
  };
};

/**
 * Logika eksekusi konversi background menggunakan ffmpeg & ffprobe
 * @param {string} taskId
 */
const processAudioConversion = (taskId) => {
  const task = taskStore.get(taskId);
  if (!task) return;

  const { inputPath, outputPath, targetFormat } = task;

  // 1. Validasi durasi audio dengan ffprobe (Maks. 8 Menit / 480 Detik)
  ffmpeg.ffprobe(inputPath, (probeErr, metadata) => {
    if (probeErr) {
      console.error('[Audio Service] Error ffprobe:', probeErr.message);
      task.status = 'failed';
      task.error = 'Gagal memproses metadata file audio.';
      removeFileIfExists(inputPath);
      return;
    }

    const durationInSeconds = metadata?.format?.duration;
    if (durationInSeconds && durationInSeconds > 480) {
      task.status = 'failed';
      task.error = 'Durasi audio melebihi batas maksimal 8 menit.';
      removeFileIfExists(inputPath);
      return;
    }

    // 2. Eksekusi konversi dengan fluent-ffmpeg
    ffmpeg(inputPath)
      .toFormat(targetFormat)
      .on('end', () => {
        task.status = 'completed';
        task.completedAt = new Date();
      })
      .on('error', (err) => {
        console.error('[Audio Service] Error konversi FFmpeg:', err.message);
        task.status = 'failed';
        task.error = err.message || 'Terjadi kesalahan saat mengonversi audio.';
        removeFileIfExists(inputPath);
        removeFileIfExists(outputPath);
      })
      .save(outputPath);
  });
};

/**
 * Mendapatkan status task saat ini
 * @param {string} taskId
 * @returns {Object|null}
 */
const getTaskStatus = (taskId) => {
  return taskStore.get(taskId) || null;
};

/**
 * Membersihkan file input dan output dari folder /temp
 * @param {string} taskId
 */
const cleanupTaskFiles = (taskId) => {
  const task = taskStore.get(taskId);
  if (task) {
    removeFileIfExists(task.inputPath);
    removeFileIfExists(task.outputPath);
    taskStore.delete(taskId);
  }
};

/**
 * Membersihkan task yang sudah berumur lebih dari maxAgeMinutes (default 30 menit)
 * dari in-memory taskStore dan menghapus file input/output dari disk jika ada.
 * @param {number} maxAgeMinutes
 * @returns {number} Jumlah task yang dibersihkan
 */
const cleanupStaleTasks = (maxAgeMinutes = 30) => {
  const now = Date.now();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  let cleanedCount = 0;

  for (const [taskId, task] of taskStore.entries()) {
    const taskAge = now - new Date(task.createdAt).getTime();
    if (taskAge > maxAgeMs) {
      if (task.inputPath) removeFileIfExists(task.inputPath);
      if (task.outputPath) removeFileIfExists(task.outputPath);
      taskStore.delete(taskId);
      cleanedCount++;
    }
  }

  return cleanedCount;
};

module.exports = {
  createConversionTask,
  processAudioConversion,
  getTaskStatus,
  cleanupTaskFiles,
  cleanupStaleTasks,
  taskStore, // diekspor untuk kemudahan testing jika diperlukan
};

