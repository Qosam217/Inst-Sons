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
 * Service client untuk menangani pemrosesan citra ke backend
 */
export const imageService = {
  /**
   * Mengompres ukuran file gambar
   * @param {File} file - 1 File gambar (Maks 15 MB)
   * @param {'low'|'medium'|'high'} level - Tingkat kompresi (default: 'medium')
   * @param {Function} [onUploadProgress] - Callback pemantauan progres upload
   * @returns {Promise<Blob>} Response buffer gambar terkompresi
   */
  compressImage: async (file, level = 'medium', onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('level', level);

    const response = await api.post('/image/compress', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Mengonversi format file gambar
   * @param {File} file - 1 File gambar (Maks 10 MB)
   * @param {'jpg'|'jpeg'|'png'|'webp'|'avif'|'gif'} format - Format target konversi
   * @param {Function} [onUploadProgress] - Callback pemantauan progres upload
   * @returns {Promise<Blob>} Response buffer gambar hasil konversi
   */
  convertImage: async (file, format = 'webp', onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    const response = await api.post('/image/convert', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      onUploadProgress,
    });
    return response.data;
  },
};

/**
 * Helper untuk parsing pesan error dari response Blob / Backend
 * @param {Error} error
 * @returns {Promise<string>}
 */
export const parseImageError = async (error) => {
  if (error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const json = JSON.parse(text);
      return json.message || 'Terjadi kesalahan saat memproses gambar.';
    } catch {
      return 'Gagal memproses gambar. Format atau berkas tidak valid.';
    }
  }
  return error.response?.data?.message || error.message || 'Terjadi kesalahan pada server backend.';
};

/**
 * Helper utilitas untuk memicu unduhan file Blob langsung ke perangkat pengguna
 * @param {Blob} blob - Data berkas biner
 * @param {string} filename - Nama file keluaran
 */
export const triggerImageDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};
