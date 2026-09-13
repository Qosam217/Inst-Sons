# Implementation Plan: Frontend Feature 01 - PDF Tools Dashboard

Dokumen perencanaan teknis dan arsitektur antarmuka pengguna (UI/UX) untuk modul **PDF Tools Dashboard** pada frontend Next.js Inst Sons. Desain mengacu pada konsep antarmuka Figma:
- **Figma URL**: [Inst Sons Figma Design (Node 11:4)](https://www.figma.com/design/T0yompeqYPS7bpBbG3F2nU/Inst-Sons?node-id=11-4&t=HS4m8dfMGFUtWNCW-0)
- **Target Route**: `/pdf` (`frontend/src/app/pdf/page.js`)

---

## 1. Deskripsi Modul & Tujuan

Modul **PDF Tools** menyediakan ruang kerja (workspace) terpadu bagi pengguna untuk mengolah dokumen PDF secara instan dan efisien langsung dari web browser. Dashboard ini mengintegrasikan 3 fungsionalitas utama backend:
1. **Merge PDF (`POST /api/pdf/merge`)**: Menggabungkan 2 hingga 5 file dokumen PDF menjadi 1 file utuh.
2. **Split PDF (`POST /api/pdf/split`)**: Memisahkan dan mengekstrak rentang halaman tertentu (`startPage` s/d `endPage`) dari 1 file PDF.
3. **Compress PDF (`POST /api/pdf/compress`)**: Memperkecil ukuran file PDF dengan opsi level kompresi (`low`, `medium`, `high`).

Antarmuka dirancang dengan tema gelap modern (*dark mode*), responsif (desktop, tablet, mobile), serta memberikan *feedback* visual yang interaktif (animasi drag-and-drop, drag/reorder file list, status pemrosesan, dan preview hasil unduhan).

---

## 2. Pemetaan Integrasi Endpoint Backend

| Fitur Tab | Endpoint Backend | Metode | Content-Type | Parameter / Payload | Response Type | Batasan Validasi |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| **Merge PDF** | `/api/pdf/merge` | `POST` | `multipart/form-data` | `files`: Array of File (2 - 5 file) | `application/pdf` (Blob) | 2-5 file, maks. 10MB/file, total maks. 30MB |
| **Split PDF** | `/api/pdf/split` | `POST` | `multipart/form-data` | `file`: 1 File<br>`startPage`: Integer<br>`endPage`: Integer | `application/pdf` (Blob) | 1 file, maks. 15MB, maks. 500 halaman, `start <= end` |
| **Compress PDF**| `/api/pdf/compress` | `POST` | `multipart/form-data` | `file`: 1 File<br>`level`: `low` \| `medium` \| `high` | `application/pdf` (Blob) | 1 file, maks. 15MB, level default `medium` |

---

## 3. Desain Sistem & Spesifikasi UI (Berdasarkan Figma Node 11:4)

### 3.1. Palet Warna & Tipografi
- **Background Utama**: Slate 900 (`#0f172a`) dengan aksen radial gradient lembut (`rgba(244, 63, 94, 0.05)`).
- **Surface / Card**: Slate 900 (`bg-slate-900/90`) dengan border `slate-800` dan hover border `rose-500/40`.
- **Aksen PDF Suite**: Rose / Crimson (`rose-500` / `#f43f5e`, `rose-600` / `#e11d48`, hover `rose-400`).
- **Teks**: Slate 100 (`#f1f5f9`) untuk Heading, Slate 300/400 (`#94a3b8`) untuk deskripsi dan label.
- **Tipografi**: Sans-serif modern (Inter / Outfit) dengan hierarki visual yang jelas.

### 3.2. Struktur Layout Halaman (`/pdf`)

```text
+-----------------------------------------------------------------------------------+
| [Navbar] Inst Sons  |  PDF Tools (Active)  |  Music  |  Image  |  [Masuk / Akun]  |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                              [Icon: FileText (Rose)]                               |
|                                PDF Tools Suite                                    |
|       Gabungkan, pisahkan, atau kompres file PDF Anda dengan cepat & aman         |
|                                                                                   |
|           +-------------------+-------------------+--------------------+          |
|           | [ ] Merge PDF (2) | [ ] Split PDF (1) | [ ] Compress (1)   | < Tab    |
|           +-------------------+-------------------+--------------------+   Nav    |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [Workspace Card Container]                                                  |  |
|  |                                                                             |  |
|  |  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +  |  |
|  |  | [FileDropzone Area]                                                   |  |  |
|  |  |    (Icon UploadCloud) Tarik & lepas file PDF di sini                  |  |  |
|  |  |    atau klik untuk memilih file dari perangkat                        |  |  |
|  |  |    Format: .pdf | Maks: 10MB - 15MB per file                          |  |  |
|  |  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +  |  |
|  |                                                                             |  |
|  |  [File Management / Parameter Config Panel]                                 |  |
|  |  - List file terpilih (Merge: urutan 1..N dengan tombol naik/turun/hapus)   |  |
|  |  - Parameter input (Split: Start Page & End Page)                           |  |
|  |  - Preset selector (Compress: Low / Medium / High cards)                    |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | [CTA Button] "Proses PDF Sekarang" (dengan Loading Spinner / Progress) |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |                                                                             |  |
|  |  [Result Section] (Muncul setelah proses selesai)                           |  |
|  |  - Status Berhasil, Nama File Hasil, Ukuran Output                         |  |
|  |  - [Tombol Unduh PDF]  |  [Tombol Proses File Baru]                         |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
| [Footer] © 2026 Inst Sons. All rights reserved.                                    |
+-----------------------------------------------------------------------------------+
```

---

## 4. Rincian Komponen & Fungsionalitas Antarmuka

### 4.1. Header & Navigation Tab (`PdfToolTabs.js`)
- Tab switcher dengan 3 pilihan sub-fitur:
  1. **Merge PDF** (Ikon: `Layers`, Badge: *2-5 files*)
  2. **Split PDF** (Ikon: `Scissors`, Badge: *Page Range*)
  3. **Compress PDF** (Ikon: `Minimize2` / `FileArchive`, Badge: *Ghostscript Optimizer*)
- Tab aktif ditandai dengan latar *solid* atau garis bawah `rose-500`, teks menyala `rose-400`, dan transisi halus (*smooth transition*).
- Mengganti tab akan mereset state file jika belum diproses, atau memberikan konfirmasi jika pengguna sedang dalam proses unggah.

---

### 4.2. Workspace Panel 1: Merge PDF (`MergePdfPanel.js`)
*Tujuan: Menggabungkan 2 hingga 5 file PDF sesuai urutan yang ditentukan pengguna.*

#### Fungsionalitas & Elemen UI:
1. **Dropzone Multi-file**:
   - Mendukung drag & drop banyak file sekaligus (`multiple={true}`, `accept: {'application/pdf': ['.pdf']}`).
   - Validasi langsung di browser: menolak file non-PDF dan file yang ukurannya > 10 MB.
2. **File Queue & Reorder List (`PdfFileList.js`)**:
   - Menampilkan daftar file yang sudah ditambahkan dalam bentuk kartu list rapi.
   - Informasi per baris: Nomor urut (1, 2, 3), Nama file, Ukuran file (contoh: `2.4 MB`), Ikon PDF.
   - Kontrol urutan:
     - Tombol **Pindah Naik ($\uparrow$)** dan **Pindah Turun ($\downarrow$)** untuk menyusun urutan penggabungan dokumen.
     - Tombol **Hapus ($\times$)** untuk membatalkan file tertentu dari antrean.
3. **Status Counter & Validasi**:
   - Indikator jumlah file: `x / 5 File` (Status hijau jika 2-5 file, status kuning/merah jika < 2 file).
   - Indikator total ukuran: `Total: xx MB / 30 MB`.
4. **Tombol Eksekusi**:
   - Label: `Gabungkan PDF (N File)`.
   - Disabled jika file < 2 atau total ukuran > 30 MB.

---

### 4.3. Workspace Panel 2: Split PDF (`SplitPdfPanel.js`)
*Tujuan: Memisahkan rentang halaman dari satu file dokumen PDF.*

#### Fungsionalitas & Elemen UI:
1. **Dropzone Single-file**:
   - Menerima tepat 1 file PDF (`multiple={false}`, maks. 15 MB).
   - Menampilkan kartu file terpilih lengkap dengan nama, ukuran, dan tombol *Ganti File* / *Hapus*.
2. **Form Konfigurasi Rentang Halaman**:
   - **Input Halaman Awal (`startPage`)**: Tipe number, default `1`, min `1`.
   - **Input Halaman Akhir (`endPage`)**: Tipe number, default `1`, min `1`.
   - **Mode Preset Cepat (Quick Badges)**:
     - `Halaman Pertama Saja` (1 - 1)
     - `3 Halaman Awal` (1 - 3)
     - `Kustom` (Input manual)
   - **Real-time Helper & Validasi**:
     - Memastikan `startPage <= endPage`.
     - Peringatan instan jika `startPage < 1` atau nomor halaman melebihi batas (maks 500).
3. **Tombol Eksekusi**:
   - Label: `Pisahkan PDF (Hal. X - Y)`.
   - Disabled jika file belum dipilih atau rentang halaman tidak valid.

---

### 4.4. Workspace Panel 3: Compress PDF (`CompressPdfPanel.js`)
*Tujuan: Mengurangi ukuran file PDF tanpa mengurangi keterbacaan dokumen.*

#### Fungsionalitas & Elemen UI:
1. **Dropzone Single-file**:
   - Menerima 1 file PDF (`multiple={false}`, maks. 15 MB).
   - Menampilkan preview ukuran asli (misal: `Ukuran Asli: 8.5 MB`).
2. **Selector Level Kompresi (Card-based Segmented Radio)**:
   - 3 Opsi kartu interaktif:
     - **Low (Ringan / Printer)**:
       - *Kualitas:* Sangat Tinggi (300 DPI)
       - *Estimasi Reduksi:* ~15% - 30%
       - *Cocok untuk:* Dokumen cetak & grafik presisi tinggi.
     - **Medium (Standar / Rekomendasi / eBook)** — *Default Active*:
       - *Kualitas:* Standar (150 DPI)
       - *Estimasi Reduksi:* ~40% - 60%
       - *Cocok untuk:* Dokumen kantor, presentasi, dan arsip digital.
     - **High (Maksimal / Screen)**:
       - *Kualitas:* Kompresi Kuat (72 DPI)
       - *Estimasi Reduksi:* ~70% - 85%
       - *Cocok untuk:* Lampiran email ukuran ketat & web preview.
3. **Tombol Eksekusi**:
   - Label: `Kompres PDF Sekarang`.
   - Disabled jika belum ada file yang dipilih.

---

### 4.5. Komponen Feedback Pemrosesan & Hasil (`PdfResultCard.js`)
1. **State Loading / Processing**:
   - Animasi *pulsing glow* dan spinner (`Loader2` dari `lucide-react`).
   - Teks dinamis: *"Menggabungkan dokumen...", "Memisahkan halaman...", "Mengompresi PDF via Ghostscript..."*.
   - Progres bar simulasi (0% $\rightarrow$ 90% $\rightarrow$ 100%).
2. **State Sukses (Success Result Card)**:
   - Ikon centang hijau `CheckCircle2` dengan efek *glow*.
   - Rincian Hasil:
     - Nama file keluaran (misal: `merged_inst-sons.pdf`, `split_pages_1-3.pdf`, `compressed_document.pdf`).
     - Ukuran file hasil (dan persentase penghematan ukuran untuk fitur Compress).
   - Aksi Utama:
     - Tombol **Unduh PDF (`Download`)**: Otomatis memicu unduhan file blob.
     - Tombol **Buka / Pratinjau PDF di Tab Baru (`ExternalLink`)**: Menggunakan `URL.createObjectURL(blob)`.
     - Tombol **Proses File Lain (`RotateCcw`)**: Mereset form kembali ke kondisi awal.
3. **State Error (`PdfErrorAlert.js`)**:
   - Alert banner warna merah/rose (`bg-rose-500/10 border-rose-500/30 text-rose-300`).
   - Parsing pesan error spesifik dari backend (misal: batas ukuran terlampaui, nomor halaman melebihi total halaman, dsb).

---

## 5. Arsitektur File & Struktur Komponen Frontend

```text
frontend/src/
├── app/
│   └── pdf/
│       └── page.js                     # Main Page Component (State Coordinator & Tab Router)
├── components/
│   ├── FileDropzone.js                 # Reusable Dropzone Component
│   ├── Button.js                       # Reusable Button & Card UI
│   └── pdf/
│       ├── PdfToolTabs.js              # Navigasi Tab Switcher (Merge, Split, Compress)
│       ├── MergePdfPanel.js            # Workspace Panel: Merge PDF
│       ├── SplitPdfPanel.js            # Workspace Panel: Split PDF
│       ├── CompressPdfPanel.js         # Workspace Panel: Compress PDF
│       ├── PdfFileList.js              # List item file dengan reorder (Up/Down) & Delete
│       ├── PdfResultCard.js            # Kartu sukses & tombol download/preview
│       └── PdfErrorAlert.js            # Komponen alert notifikasi error
└── services/
    ├── api.js                          # Axios instance dasar
    └── pdfService.js                   # API Client Service khusus modul PDF
```

---

## 6. Spesifikasi API Service (`frontend/src/services/pdfService.js`)

```javascript
import api from './api';

export const pdfService = {
  /**
   * Menggabungkan 2 - 5 file PDF
   * @param {File[]} files - Array file PDF
   * @param {Function} onUploadProgress - Callback upload progress
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
   * @param {number} startPage - Halaman awal
   * @param {number} endPage - Halaman akhir
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
   * @param {'low'|'medium'|'high'} level - Level kompresi Ghostscript
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
 * Utility helper untuk mengunduh Blob langsung ke perangkat pengguna
 */
export const triggerBlobDownload = (blob, defaultFilename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
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
| 1 | **Navigasi Tab** | Klik tab *Merge*, *Split*, atau *Compress* | Konten workspace berganti mulus, styling tab aktif berpindah (`rose-500`). |
| 2 | **Merge: Valid Upload** | Unggah 3 file PDF (< 10MB/file, total < 30MB) | Menampilkan list 3 file, counter `3/5 File`, tombol `Gabungkan PDF` aktif. |
| 3 | **Merge: Reorder File** | Klik tombol $\uparrow$ atau $\downarrow$ pada item file | Urutan file bertukar posisi secara real-time pada UI. |
| 4 | **Merge: Hapus File** | Klik ikon $\times$ pada salah satu item file | File terhapus dari list, counter berkurang. |
| 5 | **Merge: Batas Min/Maks** | Unggah 1 file atau mencoba memasukkan file ke-6 | Tombol CTA disable (jika 1 file) atau dropzone menolak file ke-6 dengan toast peringatan. |
| 6 | **Split: Valid Range** | Unggah 1 PDF, isi `startPage: 2`, `endPage: 4` | Validasi lolos, tombol `Pisahkan PDF (Hal. 2 - 4)` aktif. |
| 7 | **Split: Invalid Range** | Isi `startPage: 5`, `endPage: 2` | Muncul pesan error validasi inline: *"Halaman awal tidak boleh lebih besar dari halaman akhir"*, tombol CTA disable. |
| 8 | **Compress: Pilih Preset** | Klik kartu level `High` | Kartu `High` terpilih (border `rose-500` menyala), level terupdate. |
| 9 | **Loading State** | Klik tombol proses pada salah satu fitur | Tombol menampilkan animasi spinner & teks proses, dropzone dinonaktifkan sementara. |
| 10 | **Hasil & Unduhan** | Permintaan backend berhasil (`200 OK`) | Muncul `PdfResultCard`, tombol *Unduh PDF* berfungsi mendownload file `.pdf` yang valid. |
| 11 | **Error Handling** | Backend merespon error (`400 Bad Request`) | Muncul banner `PdfErrorAlert` dengan pesan error yang dapat dibaca jelas oleh pengguna. |

---

## 8. Rencana Tahapan Implementasi (Action Plan)

1. **Tahap 1: Setup Service API (`pdfService.js`)**
   - Buat fungsi pemanggilan API untuk ketiga endpoint (`merge`, `split`, `compress`) dengan konfigurasi `responseType: 'blob'`.
   - Implementasikan fungsi helper unduhan file blob (`triggerBlobDownload`).

2. **Tahap 2: Pembuatan Sub-komponen UI (`frontend/src/components/pdf/`)**
   - Buat `PdfToolTabs.js` untuk navigasi tab.
   - Buat `PdfFileList.js` untuk manajemen daftar file & reorder.
   - Buat `PdfResultCard.js` untuk tampilan sukses dan tombol unduhan.
   - Buat `PdfErrorAlert.js` untuk notifikasi error interaktif.

3. **Tahap 3: Implementasi Panel Workspace**
   - Implementasikan `MergePdfPanel.js` dengan validasi 2-5 file.
   - Implementasikan `SplitPdfPanel.js` dengan input halaman dan validasi rentang.
   - Implementasikan `CompressPdfPanel.js` dengan opsi kartu level kompresi.

4. **Tahap 4: Integrasi Halaman Utama (`app/pdf/page.js`)**
   - Hubungkan semua panel ke halaman utama, kelola status global (`idle`, `loading`, `success`, `error`).
   - Tambahkan animasi transisi dan sentuhan akhir styling tema dark mode Inst Sons.

5. **Tahap 5: Verifikasi & Uji Coba End-to-End**
   - Uji koneksi frontend ke backend Express (localhost:5000 / Fly.io).
   - Validasi unduhan hasil merge, split, dan compress secara langsung di browser.
