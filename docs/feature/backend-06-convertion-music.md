# Implementation Plan: Backend Feature 06 - Convert Music / Audio

Dokumen rencana implementasi untuk endpoint konversi format file audio/musik (`/api/audio`) secara asinkron (background processing dengan polling) menggunakan **fluent-ffmpeg** pada backend Inst Sons.

---

## 1. Deskripsi Fitur & Endpoint

Fitur ini memungkinkan pengguna mengonversi format file audio ke format yang diinginkan (`mp3`, `wav`, `aac`, `ogg`, `flac`). Karena konversi audio memakan waktu dan resource, proses dilakukan secara **Asinkron (Polling)** dengan menyimpan file sementara di disk server (`/backend/temp`).

Terdapat 3 endpoint utama:
1. **`POST /api/audio/convert`**: Mengunggah file audio, mencatat task, dan langsung mengembalikan `task_id` (tanpa menunggu proses FFmpeg selesai).
2. **`GET /api/audio/status/:task_id`**: Mengecek status pemrosesan audio (`processing`, `completed`, `failed`).
3. **`GET /api/audio/download/:task_id`**: Mengunduh file hasil konversi dan secara otomatis menghapus file sementara dari server.

---

## 2. Batasan Fitur (Constraints)

| Parameter | Batasan | Penanganan / Keterangan |
| :--- | :--- | :--- |
| **Jumlah File** | Tepat 1 file musik | Menggunakan `upload.single('file')` |
| **Format File Input** | `mp3`, `wav`, `ogg`, `aac`, `flac`, `m4a` | Divalidasi via `fileFilter` Multer & ekstensi file |
| **Format File Output** | `mp3`, `wav`, `aac`, `ogg`, `flac` | Divalidasi di Controller |
| **Maks. Ukuran File** | 30 MB (`30 * 1024 * 1024` bytes) | Dibatasi via Multer `limits.fileSize` |
| **Maks. Durasi Audio** | 8 Menit (480 detik) | Divalidasi via `ffprobe` sebelum konversi |
| **Metode Penyimpanan** | Disk Storage (`multer.diskStorage`) | Disimpan di `/backend/temp` dengan nama berbasis UUID |
| **Model Eksekusi** | Asinkron (Polling) | Endpoint upload langsung respons `task_id`, FFmpeg jalan di latar belakang |
| **Manajemen Storage (`/temp`)** | **CLEANUP CRITICAL** | File input & output **WAJIB** dihapus via `fs.unlink()` setelah download selesai atau jika task gagal |

---

## 3. Alur Kerja (Workflow Asinkron & Polling)

```
[Frontend]                              [Backend]                           [FFmpeg & Storage]
    |                                       |                                       |
    | 1. POST /api/audio/convert (file)    |                                       |
    |-------------------------------------->| 2. Simpan input di /temp/<uuid>.<ext> |
    |                                       | 3. Buat task (status: processing)     |
    | 4. Response { task_id, status }       | 4. Trigger FFmpeg di background ----> | 5. FFmpeg memproses file...
    |<--------------------------------------|                                       |
    |                                       |                                       |
    | 6. Polling GET /api/audio/status/:id  |                                       |
    |-------------------------------------->| Cek status di task store              |
    |    Response: status: "processing"     |                                       |
    |<--------------------------------------|                                       |
    |                                       |                                       | 7. FFmpeg selesai (.on('end'))
    |                                       | <-------------------------------------| Simpan output di /temp/<task_id>.<ext>
    |                                       | Update status task -> "completed"     |
    |                                       |                                       |
    | 8. Polling GET /api/audio/status/:id  |                                       |
    |-------------------------------------->| Status sudah "completed"              |
    |    Response: status: "completed"      |                                       |
    |<--------------------------------------|                                       |
    |                                       |                                       |
    | 9. GET /api/audio/download/:task_id   |                                       |
    |-------------------------------------->| Kirim file via res.download() ------->|
    | 10. File audio terunduh               |                                       |
    |<--------------------------------------| Di callback download:                 |
    |                                       | Hapus file input & output (/temp) --->| 11. Hapus kedua file fisik (unlink)
```

---

## 4. Komponen & Alur Implementasi

### 4.1. Route & Middleware (`backend/modules/audio/audio.routes.js`)
- Buat konfigurasi Multer menggunakan `multer.diskStorage()`:
  - `destination`: folder `path.join(__dirname, '../../temp')` (pastikan folder ada).
  - `filename`: format `audio-<uuid>.<ext>` menggunakan library `uuid`.
  - `limits`: `{ fileSize: 30 * 1024 * 1024 }` (30 MB).
  - `fileFilter`: Hanya menerima format audio (`audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/aac`, `audio/flac`, `audio/x-m4a`, `audio/mp4`, dll.).
- Definisikan 3 rute:
  ```javascript
  router.post('/convert', uploadAudio.single('file'), audioController.convertAudio);
  router.get('/status/:taskId', audioController.getTaskStatus);
  router.get('/download/:taskId', audioController.downloadAudio);
  ```

### 4.2. Service & Task Management (`backend/modules/audio/audio.service.js`)
1. **Struktur Penyimpanan Task (Task Store)**:
   - Gunakan `task_histories` (Database PostgreSQL) atau in-memory Store/Map yang melacak:
     `{ id, status: 'processing'|'completed'|'failed', inputPath, outputPath, outputFormat, originalName, error, createdAt }`.
2. **Fungsi `createConversionTask(file, targetFormat)`**:
   - Generate `taskId` (UUID).
   - Simpan entri task awal dengan status `'processing'`.
   - Jalankan fungsi `processAudioConversion(taskId)` secara background (**JANGAN di-await**).
   - Kembalikan objek `{ taskId, status: 'processing' }`.
3. **Fungsi Background `processAudioConversion(taskId)`**:
   - Gunakan `ffmpeg.ffprobe` untuk memvalidasi durasi file audio $\le$ 480 detik (8 menit). Jika melebihi, set status `'failed'`, catat error, dan hapus file input.
   - Jalankan `fluent-ffmpeg`:
     - Tentukan output path: `path.join(tempDir, `converted-${taskId}.${targetFormat}`)`.
     - Atur output format (`.toFormat(targetFormat)`).
     - Event `.on('end')`: Update status task menjadi `'completed'` dan catat `outputPath`.
     - Event `.on('error')`: Update status task menjadi `'failed'`, catat error message, dan hapus file input via `fs.unlink()`.
4. **Fungsi `getTaskStatus(taskId)`**:
   - Ambil status task berdasarkan `taskId`.
5. **Fungsi `cleanupTaskFiles(taskId)`**:
   - Hapus `inputPath` dan `outputPath` dari folder `/temp` menggunakan `fs.unlink()`.

### 4.3. Controller (`backend/modules/audio/audio.controller.js`)
1. **`convertAudio`**:
   - Validasi `req.file` dan `req.body.format`.
   - Pastikan target format adalah salah satu dari: `['mp3', 'wav', 'aac', 'ogg', 'flac']`.
   - Panggil `audioService.createConversionTask(req.file, format)`.
   - Kembalikan response `202 Accepted` atau `200 OK` berisi `task_id`.
2. **`getTaskStatus`**:
   - Ambil `taskId` dari `req.params`.
   - Panggil `audioService.getTaskStatus(taskId)`.
   - Kembalikan response status task.
3. **`downloadAudio`**:
   - Ambil data task dari service.
   - Jika status belum `completed` atau file tidak ditemukan, kembalikan `404 Not Found` / `400 Bad Request`.
   - Panggil `res.download(outputPath, downloadFileName, async (err) => { ... })`.
   - **PENTING**: Di dalam callback `res.download` (setelah pengiriman selesai atau error), jalankan pembersihan `audioService.cleanupTaskFiles(taskId)` untuk menghapus file input dan file output.

### 4.4. Aktivasi Rute di Server (`backend/server.js`)
- Pastikan rute audio aktif:
  ```javascript
  app.use('/api/audio', audioRoutes);
  ```

---

## 5. Spesifikasi API & Contoh Request / Response

### 5.1. Endpoint 1: Upload & Mulai Konversi
- **Method**: `POST`
- **Path**: `/api/audio/convert`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: `[File Audio]` (Maks 30 MB)
  - `format`: `mp3` / `wav` / `aac` / `ogg` / `flac`

**Response Sukses (`202 Accepted` / `200 OK`)**:
```json
{
  "success": true,
  "message": "Task konversi audio berhasil dibuat dan sedang diproses.",
  "data": {
    "task_id": "a3f8c120-8e12-4c21-9a72-bdf61234abcd",
    "status": "processing",
    "target_format": "mp3"
  }
}
```

---

### 5.2. Endpoint 2: Cek Status Task (Polling)
- **Method**: `GET`
- **Path**: `/api/audio/status/:task_id`

**Response (`Processing`)**:
```json
{
  "success": true,
  "data": {
    "task_id": "a3f8c120-8e12-4c21-9a72-bdf61234abcd",
    "status": "processing"
  }
}
```

**Response (`Completed`)**:
```json
{
  "success": true,
  "data": {
    "task_id": "a3f8c120-8e12-4c21-9a72-bdf61234abcd",
    "status": "completed",
    "download_url": "/api/audio/download/a3f8c120-8e12-4c21-9a72-bdf61234abcd"
  }
}
```

**Response (`Failed`)**:
```json
{
  "success": false,
  "data": {
    "task_id": "a3f8c120-8e12-4c21-9a72-bdf61234abcd",
    "status": "failed",
    "error": "Durasi audio melebihi batas maksimal 8 menit"
  }
}
```

---

### 5.3. Endpoint 3: Unduh Hasil Konversi
- **Method**: `GET`
- **Path**: `/api/audio/download/:task_id`

**Response**:
- Status: `200 OK`
- Header: `Content-Disposition: attachment; filename="converted.<ext>"`
- Body: Binary audio stream.
- *Catatan: Server otomatis menghapus file input dan output segera setelah transfer selesai.*

---

## 6. Matriks Pengujian Sederhana (Test Cases)

| No | Skenario Uji | Input | Ekspektasi Status | Ekspektasi Hasil |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Happy Path Konversi Audio** | 1 file audio valid (misal WAV 5 MB), `format: "mp3"` | `200/202` $\rightarrow$ `200` | Task dibuat (`processing`), polling menjadi `completed`, file MP3 terunduh, file di `/temp` terhapus |
| 2 | **Pilihan Format Target Beragam** | Input MP3, target `aac`, `ogg`, `flac`, atau `wav` | `200/202` | Konversi berjalan sukses sesuai format target |
| 3 | **File Audio Tidak Dilampirkan** | Form-data tanpa file | `400 Bad Request` | Pesan error file wajib diunggah |
| 4 | **Format Target Tidak Valid** | `format: "exe"` atau `format: "mp4"` | `400 Bad Request` | Pesan error format target tidak didukung |
| 5 | **Ukuran File > 30 MB** | File audio ukuran 35 MB | `400 Bad Request` | Ditolak oleh limit Multer |
| 6 | **Durasi Audio > 8 Menit** | File audio dengan durasi 10 menit | `failed` (di polling) | Status task menjadi `failed` dengan pesan durasi melebihi 8 menit, file input dihapus |
| 7 | **Download Task yang Belum Selesai / Tidak Ada** | `task_id` acak atau masih `processing` | `404 Not Found` / `400 Bad Request` | Pesan error file belum siap atau task tidak ditemukan |
| 8 | **Cleanup Setelah Download** | Download file yang sudah `completed` | `200 OK` | File terunduh, dicek fisik di server file input dan output sudah terhapus (`unlink`) |
