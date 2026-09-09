const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ytDlp = require('yt-dlp-exec');

// In-Memory Store untuk melacak task status
const taskStore = new Map();

// Helper untuk membersihkan file fisik
const removeFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`[YouTube Service] Gagal menghapus file ${filePath}:`, err.message);
    });
  }
};

/**
 * Membuat task baru dan menjalankan background download
 * @param {string} url - URL video YouTube
 * @returns {Object} { taskId, status }
 */
const createAudioTask = (url) => {
  const taskId = uuidv4();

  const taskData = {
    taskId,
    url,
    status: 'processing',
    title: null,
    duration: null,
    outputPath: null,
    error: null,
    createdAt: new Date(),
  };

  taskStore.set(taskId, taskData);

  // Jalankan proses download di background (tanpa await)
  processYoutubeDownload(taskId, url);

  return {
    taskId,
    status: 'processing',
  };
};

/**
 * Logika eksekusi download background (Two-Step Execution)
 * @param {string} taskId
 * @param {string} url
 */
const processYoutubeDownload = async (taskId, url) => {
  const task = taskStore.get(taskId);
  if (!task) return;

  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const outputPath = path.join(tempDir, `yt-${taskId}.mp3`);

  try {
    // ==========================================
    // Tahap 1: Fetch Metadata (Dump JSON)
    // ==========================================
    const metadata = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    const duration = metadata?.duration || 0;
    const title = metadata?.title || 'audio';

    task.title = title;
    task.duration = duration;

    // ==========================================
    // Tahap 2: Validasi Durasi & Download Audio
    // ==========================================
    if (duration > 900) {
      task.status = 'failed';
      task.error = 'Durasi video melebihi batas maksimal 15 menit (900 detik).';
      return;
    }

    // Ekstraksi audio-only ke format MP3
    await ytDlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: path.join(tempDir, `yt-${taskId}.%(ext)s`),
      noPlaylist: true,
    });

    task.status = 'completed';
    task.outputPath = outputPath;
    task.completedAt = new Date();
  } catch (err) {
    console.error(`[YouTube Service] Error download task ${taskId}:`, err.message);
    task.status = 'failed';
    task.error = err.message || 'Gagal memproses dan mengunduh audio dari YouTube.';
    removeFileIfExists(outputPath);
  }
};

/**
 * Mendapatkan status task
 * @param {string} taskId
 * @returns {Object|null}
 */
const getTaskStatus = (taskId) => {
  return taskStore.get(taskId) || null;
};

/**
 * Membersihkan file MP3 dari /temp dan menghapus data task
 * @param {string} taskId
 */
const cleanupTaskFile = (taskId) => {
  const task = taskStore.get(taskId);
  if (task) {
    removeFileIfExists(task.outputPath);
    taskStore.delete(taskId);
  }
};

/**
 * Membersihkan task yang sudah berumur lebih dari maxAgeMinutes (default 30 menit)
 * dari in-memory taskStore dan menghapus file output dari disk /temp jika ada.
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
      if (task.outputPath) {
        removeFileIfExists(task.outputPath);
      }
      taskStore.delete(taskId);
      cleanedCount++;
    }
  }

  return cleanedCount;
};

module.exports = {
  createAudioTask,
  processYoutubeDownload,
  getTaskStatus,
  cleanupTaskFile,
  cleanupStaleTasks,
  taskStore,
};

