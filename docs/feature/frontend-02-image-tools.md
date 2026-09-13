# Implementation Plan: Frontend Feature 02 - Image Tools Dashboard

Dokumen perencanaan teknis dan arsitektur antarmuka pengguna (UI/UX) untuk modul **Image Tools Dashboard** pada frontend Next.js Inst Sons. Desain mengacu pada konsep antarmuka Figma:
- **Figma URL**: [Inst Sons Figma Design (Node 43:101)](https://www.figma.com/design/T0yompeqYPS7bpBbG3F2nU/Inst-Sons?node-id=43-101&t=AOnC0Bouu51X2hYz-0)
- **Target Route**: `/image` (`frontend/src/app/image/page.js`)

---

## 1. Deskripsi Modul & Tujuan

Modul **Image Tools** menyediakan ruang kerja (*workspace*) terpadu bagi pengguna untuk mengolah, mengoptimasi, dan mengubah format file citra digital secara instan dan efisien langsung dari web browser. Dashboard ini terintegrasi penuh dengan engine pemrosesan citra performa tinggi di backend (**Sharp in-memory buffer**):

1. **Compress Image (`POST /api/image/compress`)**: Mengurangi ukuran file gambar dengan tingkat kompresi cerdas (`low`, `medium`, `high`) dan penyesuaian resolusi adaptif (Full HD / 1080p).
2. **Convert Image (`POST /api/image/convert`)**: Mengonversi format citra ke berbagai format standar industri modern (`jpg`, `jpeg`, `png`, `webp`, `avif`, `gif`).

Antarmuka dirancang mengusung tema gelap modern (*dark mode*) yang mewah dengan aksen warna Amber/Gold, responsif di seluruh ukuran layar (desktop, tablet, mobile), dilengkapi *instant client-side image preview*, visualizer perbandingan ukuran (sebelum vs sesudah), serta penanganan error yang komprehensif.

---

## 2. Pemetaan Integrasi Endpoint Backend

| Fitur Tab | Endpoint Backend | Metode | Content-Type | Parameter / Payload | Response Type | Batasan & Validasi Backend |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Compress Image** | `/api/image/compress` | `POST` | `multipart/form-data` | `file`: 1 File Gambar<br>`level`: `low` \| `medium` \| `high` *(default: `medium`)* | `image/*` (Stream Blob Buffer) | Tepat 1 file, maks. 15 MB, resolusi maks. 8000x8000 px, format: JPG, PNG, WebP, AVIF, GIF |
| **Convert Image** | `/api/image/convert` | `POST` | `multipart/form-data` | `file`: 1 File Gambar<br>`format`: `jpg` \| `jpeg` \| `png` \| `webp` \| `avif` \| `gif` *(Wajib)* | `image/*` (Stream Blob Buffer) | Tepat 1 file, maks. 10 MB, resolusi maks. 8192x8192 px, format target wajib valid |

---

## 3. Desain Sistem & Spesifikasi UI (Berdasarkan Figma Node 43:101)

### 3.1. Palet Warna & Visual Identity
- **Background Utama**: Slate 950 / Slate 900 (`#0b0f19` / `#0f172a`) dengan aksen radial glow hangat (`rgba(245, 158, 11, 0.06)`).
- **Surface / Container Card**: Slate 900 semi-transparan (`bg-slate-900/80 backdrop-blur-md`) dengan border `border-slate-800` dan efek hover glow `hover:border-amber-500/40`.
- **Aksen Utama Modul Image**: Amber & Warm Gold (`amber-500` / `#f59e0b`, `amber-600` / `#d97706`, `amber-400` / `#fbbf24`, glow shadow `rgba(245,158,11,0.2)`).
- **Aksen Sekunder / Indikator**:
  - Hijau Sukses / Penghematan: `emerald-400` (`#34d399`) & `emerald-500/20`
  - Informasi & Metadata: `indigo-400` (`#818cf8`) & `slate-400` (`#94a3b8`)
  - Peringatan / Error: `rose-400` (`#fb7185`) & `rose-500/20`
- **Tipografi**: Font sans-serif modern (Inter / Outfit) dengan hierarki visual kontras tinggi (Heading `text-white font-extrabold`, body `text-slate-300`, helper `text-slate-400`).

---

### 3.2. Struktur Layout Halaman (`/image`)

```text
+-----------------------------------------------------------------------------------+
| [Navbar] Inst Sons  |  PDF Tools  |  Music Tools  |  Image Tools (Active) | Masuk |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                           [Badge: Sparkles + Amber Glow]                          |
|                             IMAGE OPTIMIZATION SUITE                              |
|                              Image Tools Dashboard                                |
|        Kompres ukuran file citra atau konversi ke format modern Next-Gen          |
|                                                                                   |
|                  +-----------------------+-----------------------+                |
|                  | [ ] Kompres Gambar (1)| [ ] Konversi Format(1)| < Tool Tabs    |
|                  +-----------------------+-----------------------+                |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [Workspace Card Container - Slate 900 Backdrop Blur]                        |  |
|  |                                                                             |  |
|  |  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +  |  |
|  |  | [ImageDropzone Area]                                                  |  |  |
|  |  |    (Icon: UploadCloud / ImageIcon - Amber)                           |  |  |
|  |  |    Tarik & lepas file gambar di sini atau klik untuk memilih file    |  |  |
|  |  |    Mendukung: JPG, PNG, WebP, AVIF, GIF | Maks: 10MB - 15MB           |  |  |
|  |  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +  |  |
|  |                                                                             |  |
|  |  [File Preview & Parameter Configuration Panel]                              |  |
|  |  - Pratinjau thumbnail gambar terpilih + badge dimensi (W x H) & ukuran asli |  |
|  |                                                                             |  |
|  |  [Kondisional per Tab Aktif]:                                               |  |
|  |   * Tab Kompres: Selector Level Card (Low: Asli / Medium: 1080p / High: 720p)|  |
|  |   * Tab Konversi: Format Grid Pills (WebP, PNG, JPG, AVIF, GIF)             |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | [CTA Button] "Kompres / Konversi Gambar Sekarang" (Pulsing Glow)      |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |                                                                             |  |
|  |  [Result Section: ImageResultCard] (Muncul setelah response 200 OK)        |  |
|  |  - Pratinjau gambar output + visual perbandingan ukuran file                |  |
|  |  - Badge Penghematan (misal: "Ukuran berkurang 64.2% (1.8 MB -> 640 KB)")   |  |
|  |  - [Tombol Unduh Gambar]  |  [Tombol Preview Modal]  |  [Proses File Baru]  |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
| [Footer] © 2026 Inst Sons. All rights reserved.                                    |
+-----------------------------------------------------------------------------------+
```

---

## 4. Rincian Komponen & Fungsionalitas Antarmuka

### 4.1. Header & Navigation Tab (`ImageToolTabs.js`)
- Tab switcher horizontal dengan 2 sub-fitur utama:
  1. **Kompres Gambar** (Ikon: `Minimize2`, Badge: *Smart Lossy/Lossless*)
  2. **Konversi Format** (Ikon: `RefreshCw`, Badge: *Next-Gen AVIF/WebP*)
- State aktif ditandai dengan latar *amber gradient glow* (`bg-amber-500/10 border-amber-500 text-amber-400`), sedangkan state non-aktif berpenampilan transparan elegan.
- Berpindah tab akan membersihkan pratinjau hasil yang lama secara otomatis dan menyiapkan formulir untuk pemrosesan file baru.

---

### 4.2. Workspace Panel 1: Compress Image (`CompressImagePanel.js`)
*Tujuan: Mengurangi ukuran file gambar tanpa mengorbankan kualitas visual esensial.*

#### Fungsionalitas & Elemen UI:
1. **Dropzone & Client-side Preview**:
   - Menerima 1 file gambar (`multiple={false}`, maks. 15 MB).
   - Validasi langsung di browser (MIME type: `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`).
   - Saat file dipilih, UI langsung merender thumbnail pratinjau instan menggunakan `URL.createObjectURL(file)` beserta chip metadata:
     - Nama file (misal: `banner-landscape.png`)
     - Ukuran file asli (misal: `4.2 MB`)
     - Indikator resolusi (misal: `3840 x 2160 px`)
2. **Selector Level Kompresi (Card-based Segmented Selector)**:
   - Pengguna memilih 1 dari 3 level kompresi backend:
     - **Low (Ringan / High Quality)**:
       - *Resolusi:* Mempertahankan resolusi asli (tanpa resize).
       - *Kualitas:* 80 (Visual prima, tanpa artefak kompresi).
       - *Estimasi Reduksi:* ~20% - 40%.
       - *Rekomendasi:* Fotografi, portofolio desain, materi cetak.
     - **Medium (Standar / Rekomendasi)** — *Default Active*:
       - *Resolusi:* Resize otomatis ke lebar maks. 1920px (Full HD).
       - *Kualitas:* 60 (Keseimbangan optimal antara ukuran & ketajaman).
       - *Estimasi Reduksi:* ~50% - 70%.
       - *Rekomendasi:* Konten website, blog, media sosial, e-commerce.
     - **High (Maksimal / Super Hemat)**:
       - *Resolusi:* Resize ke lebar maks. 1080px.
       - *Kualitas:* 40 (Ukuran file ultra ringan).
       - *Estimasi Reduksi:* ~75% - 90%.
       - *Rekomendasi:* Lampiran email, thumbnail, penghematan bandwidth ketat.
3. **Tombol Eksekusi**:
   - Label dinamis: `Kompres Gambar (${level.toUpperCase()})`.
   - Disabled otomatis jika belum ada file yang dipilih atau ukuran file > 15 MB.

---

### 4.3. Workspace Panel 2: Convert Image (`ConvertImagePanel.js`)
*Tujuan: Mengubah format berkas gambar ke format ekstensi lain dengan mudah dan cepat.*

#### Fungsionalitas & Elemen UI:
1. **Dropzone & Pratinjau File Sumber**:
   - Menerima 1 file gambar (`multiple={false}`, maks. 10 MB).
   - Menampilkan kartu file sumber dengan badge format asli (misal: `PNG SOURCE`, `3.1 MB`).
2. **Selector Format Target (Interactive Grid Badges)**:
   - Pilihan format target dalam format visual card grid:
     - **WebP (Rekomendasi Web)**: Ukuran sangat kecil dengan kualitas gambar superior.
     - **PNG (Lossless & Transparansi)**: Mendukung alpha-transparency dan teks tajam.
     - **JPG / JPEG (Standar Universal)**: Kompatibilitas tinggi di semua aplikasi & sistem.
     - **AVIF (Next-Gen Ultra Kompresi)**: Teknologi kompresi mutakhir dengan rasio tertinggi.
     - **GIF (Grafik & Animasi)**: Standar format gambar berbasis palet warna.
   - Format target terpilih ditandai dengan border `amber-500`, aksen radio check, dan deskripsi keunggulan format.
3. **Deteksi Otomatis Format Sama**:
   - Jika format target sama dengan format file input, muncul badge informasi ramah: *"Format target sama dengan format asli file"*.
4. **Tombol Eksekusi**:
   - Label: `Konversi ke ${targetFormat.toUpperCase()}`.
   - Disabled jika belum ada file atau format target belum ditentukan.

---

### 4.4. Komponen Feedback Pemrosesan & Hasil (`ImageResultCard.js`)

1. **State Loading / Processing**:
   - Animasi spinner modern (`Loader2` berputar dengan efek amber glow).
   - Pesan status dinamis: *"Mengoptimasi gambar via Sharp engine..."*, *"Mengonversi format ke WebP in-memory..."*.
   - Progress bar animasi deterministik / simulated (0% $\rightarrow$ 85% $\rightarrow$ 100%).
2. **State Sukses (Success Result View)**:
   - Kartu perbandingan elegan:
     - **Pratinjau Output**: Thumbnail gambar hasil proses yang dapat diklik untuk pratinjau ukuran penuh (*Lightbox Modal*).
     - **Statistik Ukuran**:
       - Ukuran Asli vs Ukuran Baru (contoh: `4.5 MB` $\rightarrow$ `1.2 MB`).
       - Badge persentase penghematan warna hijau (`Hemat 73.3%`).
     - **Format & Metadata**: Format output (misal: `image/webp`).
   - Aksi Cepat:
     - Tombol **Unduh Gambar (`Download`)**: Mengunduh file hasil langsung ke komputer/ponsel.
     - Tombol **Pratinjau Layar Penuh (`Eye` / `ExternalLink`)**: Membuka modal preview detail resolusi tinggi.
     - Tombol **Proses Gambar Baru (`RotateCcw`)**: Mereset workspace ke kondisi awal.
3. **State Error Alert (`ImageErrorAlert.js`)**:
   - Alert banner modern warna rose/merah transparan (`bg-rose-500/10 border-rose-500/30 text-rose-300`).
   - Menerjemahkan pesan error teknis backend menjadi instruksi ramah pengguna (misal: resolusi melebihi 8000x8000px, format file rusak, batas ukuran terlampaui).

---

## 5. Arsitektur File & Struktur Komponen Frontend

```text
frontend/src/
├── app/
│   └── image/
│       └── page.js                     # Main Page Component (State Coordinator & Tab Router)
├── components/
│   ├── FileDropzone.js                 # Reusable Dropzone Component (Shared)
│   ├── Button.js                       # Reusable Button & Card Component (Shared)
│   └── image/
│       ├── ImageToolTabs.js            # Tab Switcher (Kompres Gambar / Konversi Format)
│       ├── CompressImagePanel.js       # Workspace Panel: Kompresi Gambar & Level Selector
│       ├── ConvertImagePanel.js        # Workspace Panel: Konversi Format & Format Grid
│       ├── ImageResultCard.js          # Kartu Hasil Sukses, Statistik Penghematan & Download
│       ├── ImagePreviewModal.js        # Lightbox Modal untuk pratinjau hasil gambar penuh
│       └── ImageErrorAlert.js          # Banner Notifikasi Kesalahan & Validasi
└── services/
    ├── api.js                          # Axios HTTP Client Instance dasar
    └── imageService.js                 # API Client Service khusus modul Image
```

---

## 6. Spesifikasi API Service (`frontend/src/services/imageService.js`)

```javascript
import api from './api';

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
  return error.response?.data?.message || error.message || 'Terjadi kesalahan pada server.';
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
```

---

## 7. Matriks Pengujian Antarmuka & Skenario Uji (Test Cases)

| No | Skenario Uji | Aksi Pengguna / Kondisi Input | Ekspektasi Tampilan & Perilaku Frontend |
| :-: | :--- | :--- | :--- |
| 1 | **Navigasi Tab Switcher** | Klik tab *Kompres Gambar* atau *Konversi Format* | Workspace berganti secara mulus (*smooth transition*), tab aktif menyala kuning/amber (`border-amber-500 text-amber-400`). |
| 2 | **Kompres: Dropzone File Valid** | Drag & drop 1 file PNG berukuran 4 MB | Menampilkan thumbnail gambar, nama file, ukuran asli, dan opsi level kompresi aktif. |
| 3 | **Kompres: Pilihan Preset Level** | Memilih kartu level `High` (Kompresi Maksimal) | Kartu `High` terbingkai amber, deskripsi level terupdate (resize maks 1080p, quality 40). |
| 4 | **Kompres: File Melebihi 15 MB** | Mengunggah gambar berukuran 18 MB | Dropzone menolak file dengan notifikasi error inline: *"Ukuran file gambar melebihi batas maksimal 15 MB"*. |
| 5 | **Konversi: Pilihan Format WebP** | Unggah file JPG, pilih kartu format `WebP` | Kartu WebP aktif, tombol CTA berubah menjadi `Konversi ke WEBP`. |
| 6 | **Konversi: Format Sama** | Unggah file PNG, pilih format `PNG` | Muncul indikator informatif bahwa format target sama dengan format asal file. |
| 7 | **Konversi: File Melebihi 10 MB** | Mengunggah gambar berukuran 12 MB pada tab konversi | Dropzone menolak file dengan peringatan batas 10 MB untuk konversi. |
| 8 | **File Non-Gambar** | Mengunggah file dokumen `.pdf` atau `.docx` | Dropzone otomatis menolak dan memunculkan notifikasi *"Hanya file gambar (JPG, PNG, WebP, AVIF, GIF) yang diperbolehkan"*. |
| 9 | **Loading State** | Klik tombol proses pada salah satu fitur | Tombol menampilkan animasi spinner & teks proses, form dinonaktifkan sementara (*disabled state*). |
| 10 | **Hasil & Download Gambar** | Pemrosesan backend sukses (`200 OK`) | Muncul `ImageResultCard` dengan thumbnail output, statistik penghematan ukuran, dan tombol *Unduh Gambar*. Klik tombol mengunduh file yang valid. |
| 11 | **Lightbox Preview** | Klik tombol *Pratinjau Layar Penuh* pada kartu hasil | Membuka modal `ImagePreviewModal` menampilkan gambar hasil dalam resolusi penuh tanpa keluar dari halaman. |
| 12 | **Penanganan Error Backend** | Backend merespons `400 Bad Request` (resolusi > 8000px) | Banner `ImageErrorAlert` menampilkan pesan jelas: *"Resolusi gambar melebihi batas maksimal 8000 x 8000 piksel"*. |

---

## 8. Rencana Tahapan Implementasi (Action Plan)

1. **Tahap 1: Setup Service Client (`frontend/src/services/imageService.js`)**
   - Implementasikan fungsi `compressImage` dan `convertImage` dengan `responseType: 'blob'`.
   - Buat helper parsing error blob (`parseImageError`) dan trigger download blob (`triggerImageDownload`).

2. **Tahap 2: Pembuatan Komponen UI Khusus Image (`frontend/src/components/image/`)**
   - Buat `ImageToolTabs.js` untuk navigasi antar sub-fitur dengan tema aksen Amber.
   - Buat `CompressImagePanel.js` lengkap dengan selector kartu level kompresi (`low`, `medium`, `high`).
   - Buat `ConvertImagePanel.js` dengan grid kartu pilihan format target (`webp`, `png`, `jpeg`, `avif`, `gif`).
   - Buat `ImageResultCard.js` untuk ringkasan hasil, visualisasi perbandingan ukuran, dan tombol unduhan.
   - Buat `ImagePreviewModal.js` untuk pratinjau gambar resolusi tinggi.
   - Buat `ImageErrorAlert.js` untuk menampilkan pesan kesalahan yang interaktif.

3. **Tahap 3: Refaktor & Integrasi Halaman Utama (`frontend/src/app/image/page.js`)**
   - Hubungkan seluruh panel ke state manager halaman utama (`activeTab`, `isLoading`, `result`, `errorMessage`).
   - Integrasikan client-side thumbnail preview saat pengguna memilih berkas.
   - Terapkan styling dark-mode konsisten sesuai desain Figma Node 43:101.

4. **Tahap 4: Verifikasi & Uji Coba End-to-End**
   - Jalankan pengujian langsung di browser dengan koneksi ke backend Express.
   - Uji coba skenario kompresi foto resolusi tinggi dan konversi berbagai format gambar (PNG ke WebP/AVIF, dsb.).
