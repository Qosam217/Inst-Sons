const fs = require('fs');
const path = require('path');
const youtubeService = require('../modules/youtube/youtube.service');
const audioService = require('../modules/audio/audio.service');

const DEFAULT_TEMP_DIR = path.join(__dirname, '../temp');

/**
 * Membersihkan file dan subfolder di dalam folder temp yang berusia lebih dari maxAgeMinutes (default: 30 menit).
 * File .gitkeep akan selalu diabaikan dan dipertahankan.
 * 
 * @param {string} tempDir - Path absolut direktori temp
 * @param {number} maxAgeMinutes - Batas usia file dalam menit (default 30)
 * @returns {Promise<{ deletedFiles: number, errors: number }>}
 */
async function cleanTempFolder(tempDir = DEFAULT_TEMP_DIR, maxAgeMinutes = 30) {
  let deletedFiles = 0;
  let errors = 0;

  if (!fs.existsSync(tempDir)) {
    return { deletedFiles, errors };
  }

  const now = Date.now();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;

  try {
    const entries = await fs.promises.readdir(tempDir, { withFileTypes: true });

    for (const entry of entries) {
      // Pertahankan .gitkeep agar struktur folder Git tetap utuh
      if (entry.name === '.gitkeep') {
        continue;
      }

      const fullPath = path.join(tempDir, entry.name);

      try {
        const stats = await fs.promises.stat(fullPath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAgeMs) {
          if (entry.isDirectory()) {
            // Hapus subdirektori rekursif jika ada
            await fs.promises.rm(fullPath, { recursive: true, force: true });
            deletedFiles++;
          } else if (entry.isFile()) {
            await fs.promises.unlink(fullPath);
            deletedFiles++;
          }
        }
      } catch (fileErr) {
        errors++;
        // Jangan crash server jika file sedang dikunci/dibaca proses lain
        console.warn(`[Auto-Cleanup] Warning: Tidak dapat menghapus ${entry.name}:`, fileErr.message);
      }
    }
  } catch (dirErr) {
    console.error('[Auto-Cleanup] Error membaca direktori temp:', dirErr.message);
  }

  return { deletedFiles, errors };
}

/**
 * Membersihkan seluruh data sampah berkala:
 * 1. File fisik di folder temp (> 30 menit)
 * 2. In-memory taskStore YouTube (> 30 menit)
 * 3. In-memory taskStore Audio (> 30 menit)
 * 
 * @param {number} maxAgeMinutes
 * @returns {Promise<Object>}
 */
async function cleanAllStaleData(maxAgeMinutes = 30) {
  const { deletedFiles } = await cleanTempFolder(DEFAULT_TEMP_DIR, maxAgeMinutes);
  const cleanedYtTasks = youtubeService.cleanupStaleTasks ? youtubeService.cleanupStaleTasks(maxAgeMinutes) : 0;
  const cleanedAudioTasks = audioService.cleanupStaleTasks ? audioService.cleanupStaleTasks(maxAgeMinutes) : 0;

  console.log(
    `[Auto-Cleanup] Selesai: ${deletedFiles} file temp dibersihkan, ` +
    `${cleanedYtTasks} task YouTube dibersihkan, ${cleanedAudioTasks} task Audio dibersihkan (Threshold: >${maxAgeMinutes} menit).`
  );

  return {
    deletedFiles,
    cleanedYtTasks,
    cleanedAudioTasks,
  };
}

let cleanupInterval = null;

/**
 * Menjalankan Cron Job berkala pembersih folder temp dan memori task store.
 * Dijalankan tiap 1 jam (3600000 ms) secara default dan 1x saat inisialisasi server.
 * 
 * @param {number} intervalMs - Interval eksekusi dalam milidetik (default: 1 jam = 3600000 ms)
 * @param {number} maxAgeMinutes - Batas usia file dalam menit (default: 30 menit)
 * @returns {NodeJS.Timeout}
 */
function startCleanupCron(intervalMs = 60 * 60 * 1000, maxAgeMinutes = 30) {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  // 1. Eksekusi awal saat server startup untuk membersihkan sisa restart sebelumnya
  cleanAllStaleData(maxAgeMinutes).catch((err) => {
    console.error('[Auto-Cleanup] Error pada eksekusi startup:', err.message);
  });

  // 2. Set interval berkala (tiap 1 jam)
  cleanupInterval = setInterval(() => {
    cleanAllStaleData(maxAgeMinutes).catch((err) => {
      console.error('[Auto-Cleanup] Error pada eksekusi berkala:', err.message);
    });
  }, intervalMs);

  // unref agar timer tidak menahan process exit pada unit test atau shutdown
  if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
    cleanupInterval.unref();
  }

  console.log(`⏱️  [Auto-Cleanup Cron] Aktif: Berjalan tiap ${intervalMs / (60 * 1000)} menit (Pembersihan file > ${maxAgeMinutes} menit).`);

  return cleanupInterval;
}

/**
 * Menghentikan cron job pembersih
 */
function stopCleanupCron() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[Auto-Cleanup Cron] Dihentikan.');
  }
}

module.exports = {
  cleanTempFolder,
  cleanAllStaleData,
  startCleanupCron,
  stopCleanupCron,
};
