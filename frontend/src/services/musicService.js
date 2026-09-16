import api from './api';

/**
 * Format ukuran bytes ke string yang mudah dibaca (B, KB, MB, GB)
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Format durasi detik ke format mm:ss atau hh:mm:ss
 * @param {number} seconds
 * @returns {string}
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
};

/**
 * Service client untuk menangani pemrosesan audio dan download YouTube ke backend
 */
export const musicService = {
  // ==========================================
  // 1. YouTube Audio Downloader Endpoints
  // ==========================================

  /**
   * Mengirim permintaan unduh audio dari tautan YouTube
   * @param {string} url - URL Video YouTube
   * @returns {Promise<{ task_id: string, status: string }>}
   */
  requestYoutubeDownload: async (url) => {
    const response = await api.post('/youtube/download-audio', { url });
    return response.data?.data || response.data;
  },

  /**
   * Mengecek status pemrosesan task YouTube
   * @param {string} taskId - UUID Task
   * @returns {Promise<{ status: string, title?: string, duration?: number, download_url?: string, error?: string }>}
   */
  getYoutubeTaskStatus: async (taskId) => {
    const response = await api.get(`/youtube/status/${taskId}`);
    return response.data?.data || response.data;
  },

  /**
   * Mengunduh file audio hasil ekstraksi YouTube
   * @param {string} taskId - UUID Task
   * @returns {Promise<Blob>} Response binary audio MP3
   */
  downloadYoutubeAudio: async (taskId) => {
    const response = await api.get(`/youtube/download/${taskId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ==========================================
  // 2. Audio Convert Endpoints
  // ==========================================

  /**
   * Mengunggah file audio dan memulai task konversi format
   * @param {File} file - 1 Berkas audio (Maks 30 MB)
   * @param {'mp3'|'wav'|'aac'|'ogg'|'flac'} format - Format target
   * @param {Function} [onUploadProgress] - Callback progres upload
   * @returns {Promise<{ task_id: string, status: string, target_format: string }>}
   */
  convertAudio: async (file, format = 'mp3', onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    const response = await api.post('/audio/convert', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data?.data || response.data;
  },

  /**
   * Mengecek status pemrosesan task konversi audio
   * @param {string} taskId - UUID Task
   * @returns {Promise<{ status: string, download_url?: string, error?: string }>}
   */
  getAudioTaskStatus: async (taskId) => {
    const response = await api.get(`/audio/status/${taskId}`);
    return response.data?.data || response.data;
  },

  /**
   * Mengunduh file audio hasil konversi
   * @param {string} taskId - UUID Task
   * @returns {Promise<Blob>} Response binary file audio
   */
  downloadAudio: async (taskId) => {
    const response = await api.get(`/audio/download/${taskId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ==========================================
  // 3. Polling Engine Orchestrator
  // ==========================================

  /**
   * Melakukan polling status task secara periodik hingga selesai atau gagal
   * @param {Function} statusFetcher - Fungsi fetcher status (getYoutubeTaskStatus / getAudioTaskStatus)
   * @param {string} taskId - ID Task yang dipantau
   * @param {Object} options - Opsi polling
   * @param {number} [options.intervalMs=2000] - Interval pengecekan (ms)
   * @param {number} [options.maxAttempts=150] - Maksimal percobaan (default: 5 menit)
   * @param {Function} [options.onProgress] - Callback setiap siklus polling
   * @param {AbortSignal} [options.signal] - Abort signal untuk membatalkan polling
   * @returns {Promise<Object>} Data task final dengan status 'completed'
   */
  pollTaskUntilComplete: async (statusFetcher, taskId, options = {}) => {
    const { intervalMs = 2000, maxAttempts = 150, onProgress, signal } = options;
    let attempts = 0;

    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new DOMException('Proses dibatalkan oleh pengguna.', 'AbortError'));
      }

      const intervalId = setInterval(async () => {
        if (signal?.aborted) {
          clearInterval(intervalId);
          return reject(new DOMException('Proses dibatalkan oleh pengguna.', 'AbortError'));
        }

        attempts += 1;
        try {
          const res = await statusFetcher(taskId);
          const taskData = res?.data || res;

          if (onProgress) {
            onProgress(taskData, attempts);
          }

          if (taskData.status === 'completed') {
            clearInterval(intervalId);
            resolve(taskData);
          } else if (taskData.status === 'failed') {
            clearInterval(intervalId);
            reject(new Error(taskData.error || 'Pemrosesan audio gagal di server.'));
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            reject(new Error('Waktu tunggu proses audio telah habis (Timeout).'));
          }
        } catch (err) {
          clearInterval(intervalId);
          reject(err);
        }
      }, intervalMs);

      if (signal) {
        signal.addEventListener('abort', () => {
          clearInterval(intervalId);
          reject(new DOMException('Proses dibatalkan oleh pengguna.', 'AbortError'));
        });
      }
    });
  },
};

/**
 * Helper untuk memicu unduhan file Blob langsung ke perangkat pengguna
 * @param {Blob} blob - Data berkas biner
 * @param {string} filename - Nama file keluaran
 */
export const triggerAudioDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

/**
 * Helper untuk parsing pesan error dari response Axios/Server
 * @param {Error} error
 * @returns {Promise<string>}
 */
export const parseAudioError = async (error) => {
  if (error?.name === 'AbortError') {
    return 'Proses dibatalkan oleh pengguna.';
  }
  if (error?.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const json = JSON.parse(text);
      return json.message || 'Terjadi kesalahan saat memproses audio.';
    } catch {
      return 'Gagal memproses audio. Berkas tidak valid.';
    }
  }
  return error?.response?.data?.message || error?.message || 'Terjadi kesalahan pada server saat memproses audio.';
};
