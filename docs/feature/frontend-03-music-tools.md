# Implementation Plan: Frontend Feature 03 - Music Tools Dashboard

Dokumen perencanaan teknis dan arsitektur antarmuka pengguna (UI/UX) untuk modul **Music Tools Dashboard** pada frontend Next.js Inst Sons. Desain mengacu pada konsep antarmuka Figma:
- **Figma URL**: [Inst Sons Figma Design (Node 43:7)](https://www.figma.com/design/T0yompeqYPS7bpBbG3F2nU/Inst-Sons?node-id=43-7&t=EDIKMyIyubp0bG3U-0)
- **Target Route**: `/music` (`frontend/src/app/music/page.js`)

---

## 1. Deskripsi Modul & Tujuan

Modul **Music Tools** menyediakan ruang kerja (*workspace*) terpadu bagi pengguna untuk mengekstrak, mengunduh, dan mengonversi format file audio/musik secara instan, aman, dan efisien langsung dari web browser. Dashboard ini terintegrasi penuh dengan arsitektur pemrosesan asinkron (*background polling architecture*) di backend yang didukung oleh **FFmpeg** dan **yt-dlp**:

1. **YouTube Audio Downloader (`/api/youtube`)**: Mengekstrak dan mengunduh track audio langsung dari tautan video YouTube menjadi file MP3 berkualitas tinggi.
2. **Convert Format Audio (`/api/audio`)**: Mengonversi format file musik ke berbagai format standar audio (`mp3`, `wav`, `aac`, `ogg`, `flac`) menggunakan engine pemrosesan audio FFmpeg.

Antarmuka dirancang dengan tema gelap modern (*dark mode*) mewah beraksen warna **Emerald & Mint Green**, responsif di seluruh ukuran layar (desktop, tablet, mobile), dilengkapi *real-time polling progress tracker*, *built-in audio player preview*, pemilih format interaktif, serta penanganan error yang komprehensif.

---

## 2. Pemetaan Integrasi Endpoint Backend

| Fitur Tab | Endpoint Backend | Metode | Content-Type | Parameter / Payload | Response Type | Batasan & Validasi Backend |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **YouTube Downloader (Create)** | `/api/youtube/download-audio` | `POST` | `application/json` | `url`: string (URL YouTube valid) | `JSON { task_id, status }` | Format URL YouTube valid, durasi video maks. 15 menit (900 detik) |
| **YouTube Downloader (Polling)** | `/api/youtube/status/:taskId` | `GET` | - | `taskId`: UUID | `JSON { status, title, duration, download_url, error }` | Status: `processing`, `completed`, `failed` |
| **YouTube Downloader (Download)** | `/api/youtube/download/:taskId` | `GET` | - | `taskId`: UUID | `audio/mpeg` (Stream Attachment) | Otomatis membersihkan file MP3 sementara dari server setelah unduh selesai |
| **Convert Audio (Create)** | `/api/audio/convert` | `POST` | `multipart/form-data` | `file`: 1 File Audio<br>`format`: `mp3` \| `wav` \| `aac` \| `ogg` \| `flac` | `JSON { task_id, status, target_format }` | Tepat 1 file, maks. 30 MB, durasi audio maks. 8 menit (480 detik), format input: MP3, WAV, OGG, AAC, FLAC, M4A |
| **Convert Audio (Polling)** | `/api/audio/status/:taskId` | `GET` | - | `taskId`: UUID | `JSON { status, download_url, error }` | Status: `processing`, `completed`, `failed` |
| **Convert Audio (Download)** | `/api/audio/download/:taskId` | `GET` | - | `taskId`: UUID | `audio/*` (Stream Attachment) | Otomatis menghapus file input dan output sementara dari server setelah unduh selesai |

---

## 3. Desain Sistem & Spesifikasi UI (Berdasarkan Figma Node 43:7)

### 3.1. Palet Warna & Visual Identity
- **Background Utama**: Slate 950 / Slate 900 (`#0b0f19` / `#0f172a`) dengan aksen radial glow hijau emerald (`rgba(16, 185, 129, 0.07)`).
- **Surface / Container Card**: Slate 900 semi-transparan (`bg-slate-900/80 backdrop-blur-md`) dengan border `border-slate-800` dan efek hover glow `hover:border-emerald-500/40`.
- **Aksen Utama Modul Music**: Emerald & Mint Green (`emerald-500` / `#10b981`, `emerald-600` / `#059669`, `emerald-400` / `#34d399`, glow shadow `rgba(16,185,129,0.25)`).
- **Aksen Sekunder / Indikator**:
  - YouTube Brand Accent: `rose-500` (`#f43f5e`) & `rose-600` untuk ikon identitas YouTube.
  - Cyan & Audio Wave: `teal-400` (`#2dd4bf`) & `cyan-400` (`#22d3ee`) untuk indikator visual gelombang suara.
  - Informasi & Durasi: `slate-400` (`#94a3b8`) & `indigo-400` (`#818cf8`).
  - Peringatan / Error: `rose-400` (`#fb7185`) & `rose-500/20`.
- **Tipografi**: Font sans-serif modern (Inter / Outfit) dengan hierarki visual kontras tinggi (Heading `text-white font-extrabold`, body `text-slate-300`, helper `text-slate-400`).

---

### 3.2. Struktur Layout Halaman (`/music`)

```text
+-----------------------------------------------------------------------------------+
| [Navbar] Inst Sons  |  PDF Tools  |  Music Tools (Active)  |  Image Tools  | Masuk|
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                          [Badge: Music Note + Emerald Glow]                       |
|                             AUDIO PROCESSING & EXTRACTION                         |
|                                 Music Tools Suite                                 |
|          Unduh audio dari YouTube atau konversi format audio Anda dengan mudah    |
|                                                                                   |
|                 +----------------------------+----------------------------+       |
|                 | [ ] Unduh dari YouTube (1) | [ ] Konversi Format (1)    | < Tab |
|                 +----------------------------+----------------------------+       |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [Workspace Card Container - Slate 900 Backdrop Blur]                        |  |
|  |                                                                             |  |
|  |  [KONDISI TAB 1: YOUTUBE DOWNLOADER]                                        |  |
|  |  - Input URL YouTube + Tombol "Tempel URL" (Paste from Clipboard)          |  |
|  |  - Info Alert Badge: "Mendukung link video YouTube standar & Shorts.        |  |
|  |                      Batas durasi video maksimal 15 Menit."                 |  |
|  |  - Pilihan Kualitas / Format Ekstraksi (MP3 320kbps / 192kbps / 128kbps)     |  |
|  |                                                                             |  |
|  |  [KONDISI TAB 2: KONVERSI FORMAT AUDIO]                                     |  |
|  |  - Dropzone Audio File (MP3, WAV, OGG, AAC, FLAC, M4A | Maks 30MB & 8 Menit)  |  |
|  |  - Card Audio Source terpilih + Nama file + Ukuran + Audio Preview Player    |  |
|  |  - Selector Format Target Grid Cards (MP3, WAV, AAC, OGG, FLAC)             |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | [CTA Button] "Mulai Ekstraksi / Konversi Audio" (Emerald Pulsing Glow)|  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |                                                                             |  |
|  |  [Polling State: AudioProcessingStatus] (Muncul saat task diproses)         |  |
|  |  - Stepper Progres: 1. Inisialisasi -> 2. Download / FFmpeg -> 3. Selesai   |  |
|  |  - Animasi Waveform Audio Bars + Spinner + Tombol "Batalkan"               |  |
|  |                                                                             |  |
|  |  [Result Section: AudioResultCard] (Muncul saat polling "completed")        |  |
|  |  - Header Sukses: Judul Lagu / Nama File + Badge Format & Durasi            |  |
|  |  - Integrated HTML5 Audio Player (Play/Pause, Seekbar, Volume)             |  |
|  |  - [Tombol Unduh File Audio]  |  [Tombol Proses Audio Lainnya]             |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
| [Footer] © 2026 Inst Sons. All rights reserved.                                    |
+-----------------------------------------------------------------------------------+
```

---

## 4. Rincian Komponen & Fungsionalitas Antarmuka

### 4.1. Header & Navigation Tab (`MusicToolTabs.js`)
- Tab switcher horizontal dengan 2 sub-fitur utama:
  1. **Unduh dari YouTube** (Ikon: `Youtube`, Badge: *Extract MP3 Instant*)
  2. **Konversi Format Audio** (Ikon: `RefreshCw` / `Music`, Badge: *FFmpeg Engine*)
- State aktif ditandai dengan latar *emerald gradient glow* (`bg-emerald-500/10 border-emerald-500 text-emerald-400`), sedangkan state non-aktif berpenampilan transparan elegan.
- Berpindah tab akan membersihkan proses polling aktif atau hasil yang lama secara otomatis untuk mencegah tumpang tindih state.

---

### 4.2. Workspace Panel 1: YouTube Downloader (`YoutubeDownloaderPanel.js`)
*Tujuan: Mengambil URL video YouTube, mengekstrak track audio, dan menyediakan unduhan file MP3.*

#### Fungsionalitas & Elemen UI:
1. **Input URL Interaktif**:
   - Field input URL dengan ikon YouTube (`Youtube`) di sisi kiri.
   - Tombol **Tempel (Paste)** di sisi kanan field untuk menyalin URL langsung dari clipboard perangkat dengan 1 klik (`navigator.clipboard.readText()`).
   - Tombol **Hapus (Clear)** jika field telah terisi.
   - Validasi Regex URL YouTube di sisi browser (`youtube.com/watch`, `youtu.be/`, `music.youtube.com/`).
2. **Kartu Informasi Batasan (Constraints Notice)**:
   - Banner informasi berwarna slate/emerald:
     - Durasi video maksimal: **15 Menit** (mencegah kegagalan ekstraksi playlist/podcast panjang).
     - Format hasil otomatis: **MP3 Audio Stream**.
3. **Pilihan Kualitas Audio (Audio Quality Pills / Cards)**:
   - **High Quality (320 kbps)** — *Default*: Kualitas prima untuk pemutar musik & headphone.
   - **Standard Quality (192 kbps)**: Keseimbangan file ringan dan kejelasan audio.
   - **Compact (128 kbps)**: Ukuran file sangat hemat untuk penyimpanan terbatas.
4. **Tombol Eksekusi**:
   - Label: `Ekstrak & Unduh MP3`.
   - Disabled otomatis jika URL kosong atau pola URL tidak valid.

---

### 4.3. Workspace Panel 2: Convert Audio (`ConvertAudioPanel.js`)
*Tujuan: Mengonversi file audio lokal ke format ekstensi audio modern lainnya.*

#### Fungsionalitas & Elemen UI:
1. **Dropzone & Pratinjau File Sumber**:
   - Menerima 1 file audio (`multiple={false}`, maks. 30 MB).
   - Mendukung ekstensi: `.mp3`, `.wav`, `.ogg`, `.aac`, `.flac`, `.m4a`.
   - Saat file dipilih, tampil kartu file sumber dengan:
     - Nama file audio & ukuran file.
     - Pratinjau pemutar audio instan di browser (`URL.createObjectURL(file)`) agar pengguna dapat mendengarkan file sebelum konversi.
     - Tombol hapus/ganti file.
2. **Selector Format Target (Interactive Grid Cards)**:
   - Pilihan format target audio dalam bentuk kartu grid interaktif:
     - **MP3 (Standar Universal)**: Kompatibilitas 100% di semua perangkat & media player.
     - **WAV (Lossless Uncompressed)**: Kualitas studio murni tanpa kompresi data.
     - **AAC (Advanced Audio Coding)**: Efisiensi kompresi tinggi standar Apple & streaming.
     - **OGG (Open Source Vorbis)**: Format open-source berkualitas tinggi untuk game & web.
     - **FLAC (Free Lossless Audio)**: Kompresi tanpa kehilangan detail audio audiophile.
   - Kartu format terpilih ditandai dengan border `emerald-500`, radio check, dan deskripsi karakteristik format.
3. **Deteksi Otomatis Format Sama**:
   - Memberikan notifikasi informatif jika format target sama dengan format asal file.
4. **Tombol Eksekusi**:
   - Label: `Konversi ke ${targetFormat.toUpperCase()}`.
   - Disabled jika file belum dipilih atau format target belum ditentukan.

---

### 4.4. Komponen Status Polling Pemrosesan (`AudioProcessingStatus.js`)
*Tujuan: Menampilkan feedback real-time saat backend memproses audio di latar belakang secara asinkron.*

1. **Visual Status Tracker**:
   - **Animasi Waveform**: Bar gelombang audio bergerak (*bouncing audio bars*) dengan warna hijau emerald menyala.
   - **Pesan Status Dinamis**:
     - Tahap 1: *"Mengunggah file audio ke server..."* / *"Menghubungi server YouTube..."*
     - Tahap 2: *"Mengekstrak track audio via FFmpeg / yt-dlp engine..."*
     - Tahap 3: *"Menyiapkan berkas unduhan..."*
2. **Indikator Waktu & Polling**:
   - Timer counter berjalan (contoh: `Memproses: 00:12`).
   - Interval polling setiap 2 detik ke endpoint status (`/api/audio/status/:taskId` atau `/api/youtube/status/:taskId`).
3. **Tombol Batalkan**:
   - Memungkinkan pengguna membatalkan proses polling dan kembali ke formulir input jika diinginkan.

---

### 4.5. Komponen Hasil & Audio Player (`AudioResultCard.js`)
*Tujuan: Menampilkan hasil unduhan/konversi yang sukses beserta pemutar suara terintegrasi dan tombol unduhan langsung.*

1. **Elemen Kartu Hasil**:
   - **Ikon Status Sukses**: Badge centang emerald dengan efek glow.
   - **Informasi Metadata**:
     - Judul lagu / nama file hasil (misal: `Rick Astley - Never Gonna Give You Up.mp3`).
     - Format output (misal: `MP3 AUDIO` / `FLAC LOSSLESS`).
     - Status siap unduh.
2. **Pemutar Audio Terintegrasi (Built-in Audio Player)**:
   - Menggunakan audio stream Blob atau URL download untuk memutar lagu langsung di browser.
   - Kontrol pemutar: Play/Pause, Seekbar waktu audio, Durasi saat ini / Total durasi, Kontrol Volume.
3. **Aksi Cepat (Action Buttons)**:
   - Tombol **Unduh Audio (`Download`)**: Mengunduh berkas audio ke penyimpanan lokal pengguna.
   - Tombol **Proses File Lain (`RotateCcw`)**: Mereset form dan siap untuk pemrosesan file baru.
   - *Catatan:* Menampilkan reminder ramah bahwa file di server akan otomatis dibersihkan setelah diunduh demi keamanan & privasi data.

---

### 4.6. Komponen Penanganan Kesalahan (`AudioErrorAlert.js`)
- Menampilkan pesan kegagalan ramah pengguna untuk berbagai skenario:
  - Video YouTube melebihi batas 15 menit.
  - Durasi file audio melebihi batas 8 menit.
  - Video YouTube bersifat privat / dibatasi wilayah (*geo-restricted*).
  - File audio rusak atau format tidak dikenali.
  - Timeout koneksi polling backend.

---

## 5. Arsitektur File & Struktur Komponen Frontend

```text
frontend/src/
├── app/
│   └── music/
│       └── page.js                     # Main Page Component (Coordinator & State Manager)
├── components/
│   ├── FileDropzone.js                 # Reusable Dropzone Component (Shared)
│   ├── Button.js                       # Reusable Button & Card Component (Shared)
│   └── music/
│       ├── MusicToolTabs.js            # Tab Switcher (YouTube Downloader / Konversi Audio)
│       ├── YoutubeDownloaderPanel.js   # Panel Form Unduh YouTube & Selector Kualitas
│       ├── ConvertAudioPanel.js        # Panel Form Konversi Audio & Format Grid Cards
│       ├── AudioProcessingStatus.js    # Progress Bar & Waveform Polling Status Tracker
│       ├── AudioResultCard.js          # Kartu Hasil Sukses, Audio Player & Tombol Unduh
│       ├── AudioPlayerWidget.js        # Mini Audio Player UI (Play/Pause, Slider, Waveform)
│       └── AudioErrorAlert.js          # Banner Notifikasi Kesalahan & Validasi
└── services/
    ├── api.js                          # Axios HTTP Client Instance dasar
    └── musicService.js                 # API Client Service & Polling Engine khusus Music
```

---

## 6. Spesifikasi API Service (`frontend/src/services/musicService.js`)

```javascript
import api from './api';

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
    return response.data;
  },

  /**
   * Mengecek status pemrosesan task YouTube
   * @param {string} taskId - UUID Task
   * @returns {Promise<{ status: string, title?: string, duration?: number, download_url?: string, error?: string }>}
   */
  getYoutubeTaskStatus: async (taskId) => {
    const response = await api.get(`/youtube/status/${taskId}`);
    return response.data;
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
    return response.data;
  },

  /**
   * Mengecek status pemrosesan task konversi audio
   * @param {string} taskId - UUID Task
   * @returns {Promise<{ status: string, download_url?: string, error?: string }>}
   */
  getAudioTaskStatus: async (taskId) => {
    const response = await api.get(`/audio/status/${taskId}`);
    return response.data;
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
   * @returns {Promise<Object>} Data task final dengan status 'completed'
   */
  pollTaskUntilComplete: async (statusFetcher, taskId, options = {}) => {
    const { intervalMs = 2000, maxAttempts = 150, onProgress } = options;
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        attempts += 1;
        try {
          const res = await statusFetcher(taskId);
          const taskData = res.data || res;

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
 * @returns {string}
 */
export const parseAudioError = (error) => {
  return error.response?.data?.message || error.message || 'Terjadi kesalahan pada server saat memproses audio.';
};
```

---

## 7. Matriks Pengujian Antarmuka & Skenario Uji (Test Cases)

| No | Skenario Uji | Aksi Pengguna / Kondisi Input | Ekspektasi Tampilan & Perilaku Frontend |
| :-: | :--- | :--- | :--- |
| 1 | **Navigasi Tab Switcher** | Klik tab *Unduh dari YouTube* atau *Konversi Format* | Panel aktif berganti dengan transisi mulus, tab aktif menyala hijau emerald (`border-emerald-500 text-emerald-400`). |
| 2 | **YouTube: Validasi Input URL** | Memasukkan URL invalid (contoh: `https://google.com`) | Field menampilkan indikator peringatan dan tombol CTA tetap dalam keadaan *disabled*. |
| 3 | **YouTube: Tombol Tempel URL** | Klik tombol *Tempel* dengan URL YouTube di clipboard | Field otomatis terisi tautan YouTube dan tombol CTA menjadi aktif (*enabled*). |
| 4 | **YouTube: Video > 15 Menit** | Memasukkan URL video berdurasi 30 menit | Polling mendeteksi status `failed`, menampilkan alert: *"Durasi video melebihi batas maksimal 15 menit (900 detik)"*. |
| 5 | **YouTube: Ekstraksi Berhasil** | Memasukkan URL lagu YouTube berdurasi 4 menit | Muncul status polling dengan animasi audio wave $\rightarrow$ berubah menjadi `AudioResultCard` dengan judul lagu, pemutar suara, dan tombol unduh MP3. |
| 6 | **Konversi: Dropzone File Audio** | Drag & drop 1 file audio `.wav` berukuran 12 MB | Menampilkan kartu file sumber, ukuran berkas, pemutar audio pratinjau lokal, dan grid format target. |
| 7 | **Konversi: File Melebihi 30 MB** | Mengunggah file audio berukuran 35 MB | Dropzone langsung menolak file dengan peringatan: *"Ukuran file audio melebihi batas maksimal 30 MB"*. |
| 8 | **Konversi: File Non-Audio** | Mengunggah file `.pdf` atau `.exe` | Dropzone menolak berkas dengan pesan: *"Hanya format audio (MP3, WAV, OGG, AAC, FLAC, M4A) yang didukung"*. |
| 9 | **Konversi: Format Sama** | Memilih format target `WAV` untuk file sumber `.wav` | Muncul badge ramah: *"Format target sama dengan format asal file"*. |
| 10 | **Konversi: Audio > 8 Menit** | Mengunggah file podcast berdurasi 12 menit | Backend merespons gagal saat ffprobe, polling menampilkan pesan: *"Durasi audio melebihi batas maksimal 8 menit"*. |
| 11 | **Audio Player Preview** | Klik tombol Play pada `AudioResultCard` | Audio terputar langsung di browser dengan kontrol volume dan visual progress bar yang bergerak. |
| 12 | **Unduh File Hasil** | Klik tombol *Unduh Audio* | File biner terunduh ke perangkat pengguna dengan nama file yang sesuai dan file sementara di server terhapus otomatis. |
| 13 | **Pembatalan Polling** | Klik tombol *Batalkan* saat proses polling sedang berjalan | Polling berhenti segera dan UI kembali ke formulir input awal secara bersih. |

---

## 8. Rencana Tahapan Implementasi (Action Plan)

1. **Tahap 1: Pembuatan Service Client & Polling Engine (`frontend/src/services/musicService.js`)**
   - Implementasikan fungsi API untuk YouTube downloader dan konversi audio (`requestYoutubeDownload`, `getYoutubeTaskStatus`, `downloadYoutubeAudio`, `convertAudio`, `getAudioTaskStatus`, `downloadAudio`).
   - Bangun helper `pollTaskUntilComplete` dengan penanganan timeout dan error response.
   - Buat helper `triggerAudioDownload` dan `parseAudioError`.

2. **Tahap 2: Pembuatan Komponen UI Khusus Music (`frontend/src/components/music/`)**
   - Buat `MusicToolTabs.js` untuk navigasi antar sub-fitur dengan aksen Emerald.
   - Buat `YoutubeDownloaderPanel.js` dengan integrasi clipboard paste dan selector bitrate.
   - Buat `ConvertAudioPanel.js` dengan dropzone audio dan grid kartu format target (`mp3`, `wav`, `aac`, `ogg`, `flac`).
   - Buat `AudioProcessingStatus.js` dengan animasi gelombang suara (*waveform animation*) dan status stepper.
   - Buat `AudioPlayerWidget.js` & `AudioResultCard.js` untuk pemutar audio interaktif dan tombol unduh.
   - Buat `AudioErrorAlert.js` untuk menampilkan pesan kesalahan teknis dalam bahasa ramah pengguna.

3. **Tahap 3: Integrasi State & Halaman Utama (`frontend/src/app/music/page.js`)**
   - Hubungkan seluruh panel dan sub-komponen ke coordinator state utama (`activeTab`, `isProcessing`, `pollingProgress`, `resultData`, `errorMessage`).
   - Terapkan gaya visual bertema dark mode modern dengan aksen emerald neon glow sesuai spesifikasi Figma Node 43:7.

4. **Tahap 4: Verifikasi & Uji Coba End-to-End**
   - Uji alur unduh audio dari YouTube dengan variasi durasi video.
   - Uji alur konversi berbagai format audio (WAV ke MP3, FLAC ke AAC, dll.).
   - Pastikan pemutar suara berfungsi lancar dan pembersihan file sementara di backend berjalan sempurna.
