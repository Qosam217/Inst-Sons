import api from './api';

/**
 * Helper untuk mem-parsing error response saat responseType adalah 'blob'
 * @param {any} error
 * @returns {Promise<string>}
 */
export async function parsePdfError(error) {
  if (error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const json = JSON.parse(text);
      if (json.message) return json.message;
      if (json.error) return json.error;
    } catch {
      // Abaikan jika bukan JSON text
    }
  }
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Terjadi kesalahan saat memproses file PDF.'
  );
}

/**
 * Format bytes ke string yang mudah dibaca (KB / MB)
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export const pdfService = {
  /**
   * Menggabungkan 2 - 5 file PDF
   * @param {File[]} files - Array file PDF
   * @param {Function} [onUploadProgress] - Callback upload progress
   * @returns {Promise<Blob>}
   */
  mergePdf: async (files, onUploadProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/pdf/merge', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Memisahkan halaman tertentu dari file PDF
   * @param {File} file - 1 File PDF
   * @param {number} startPage - Halaman awal (1-based)
   * @param {number} endPage - Halaman akhir (1-based)
   * @param {Function} [onUploadProgress] - Callback upload progress
   * @returns {Promise<Blob>}
   */
  splitPdf: async (file, startPage, endPage, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startPage', startPage);
    formData.append('endPage', endPage);

    const response = await api.post('/pdf/split', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Mengompres ukuran file PDF
   * @param {File} file - 1 File PDF
   * @param {'low'|'medium'|'high'} [level='medium'] - Level kompresi
   * @param {Function} [onUploadProgress] - Callback upload progress
   * @returns {Promise<Blob>}
   */
  compressPdf: async (file, level = 'medium', onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('level', level);

    const response = await api.post('/pdf/compress', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      onUploadProgress,
    });
    return response.data;
  },
};

/**
 * Utility helper untuk mengunduh Blob langsung ke browser pengguna
 * @param {Blob} blob
 * @param {string} defaultFilename
 */
export const triggerBlobDownload = (blob, defaultFilename = 'document.pdf') => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};
