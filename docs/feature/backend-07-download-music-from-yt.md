# Implementation Plan: Backend Feature 07 - Download Music from YouTube

Dokumen rencana implementasi untuk endpoint unduh audio/musik dari YouTube (`/api/youtube`) secara asinkron (background processing dengan polling) menggunakan **yt-dlp-exec** pada backend Inst Sons.

---

## 1. Deskripsi Fitur & Endpoint

Fitur ini memungkinkan pengguna mengekstrak dan mengunduh lagu/musik dari tautan YouTube langsung dalam format MP3. Karena proses pengunduhan dan ekstraksi audio dari YouTube membutuhkan waktu dan bandwidth, proses dilakukan secara **Asinkron (Polling)** dengan menyimpan file sementara di direktori server (`/backend/temp`).

Terdapat 3 endpoint utama:
1. **`POST /api/youtube/download-audio`**: Menerima URL YouTube, memvalidasi input dasar, mencatat task, dan langsung mengembalikan `task_id` (tanpa menunggu proses download selesai).
2. **`GET /api/youtube/status/:task_id`**: Mengecek status pemrosesan audio (`processing`, `completed`, `failed`).
3. **`GET /api/youtube/download/:task_id`**: Mengunduh file MP3 hasil ekstraksi dan secara otomatis menghapus file sementara dari server.

---

## 2. Batasan Fitur (Constraints)

| Parameter | Batasan | Penanganan / Keterangan |
| :--- | :--- | :--- |
| **Batas Durasi Video (Kritis)** | Maksimal 15 Menit (900 detik) | Mencegah unduhan podcast panjang / kompilasi album. Divalidasi di Tahap 1 (Metadata) sebelum download. |
| **Batas Bandwidth (Audio-Only)** | Unduh track audio saja | Gunakan opsi audio extraction (`extractAudio: true, audioFormat: 'mp3'`). Dilarang mengunduh video utuh. |
| **Format Output** | MP3 (`.mp3`) | Ekstraksi default ke format audio MP3. |
| **Model Eksekusi** | Asinkron (Polling) | Endpoint POST langsung merespons `task_id`. Eksekusi yt-dlp berjalan di background. |
| **Penyimpanan File** | Disk Storage (`/backend/temp`) | Disimpan di `/backend/temp` dengan format nama unik berbasis UUID (`yt-<taskId>.mp3`). |
| **Manajemen Storage (`/temp`)** | **CLEANUP CRITICAL** | File MP3 **WAJIB** dihapus via `fs.unlink()` segera setelah file selesai dikirim ke klien atau saat task gagal. |

---

## 3. Dependency & Environment Stack

- **OS / Docker Level**:
  - `python3`: Engine utama pengeksekusi script yt-dlp.
  - `ffmpeg`: Engine ekstraksi dan konversi audio stream ke MP3.
  *(Keduanya telah terpasang di `Dockerfile`)*.
- **Node.js Libraries**:
  - `yt-dlp-exec`: Wrapper otomatis untuk menjalankan binary yt-dlp.
  - `uuid`: Generate `task_id` dan penamaan file unik di `/temp`.
  - `fs` / `fs.promises`: Operasi hapus file sementara setelah diunduh.

---

## 4. Alur Kerja (Workflow Asinkron & Eksekusi Dua Tahap)

```
[Frontend]                                 [Backend]                             [yt-dlp & Storage]
    |                                          |                                         |
    | 1. POST /api/youtube/download-audio      |                                         |
    |    Body: { url: "https://youtu.be/..." } |                                         |
    |----------------------------------------->| 2. Generate task_id & simpan status     |
    |                                          |    task = 'processing'                  |
    | 3. Response { task_id, status }          | 4. Trigger background task -----------> |
    |<-----------------------------------------|                                         |
    |                                          |                                         | [Tahap 1: Fetch Metadata]
    |                                          |                                         | Jalankan yt-dlp --dump-json
    |                                          |                                         | Dapatkan { title, duration }
    |                                          |                                         |
    |                                          |                                         | [Tahap 2: Validasi & Download]
    |                                          |                                         | Jika duration > 900s:
    |                                          |                                         |   Set status = 'failed'
    |                                          |                                         | Jika duration <= 900s:
    |                                          |                                         |   Download audio only ke /temp/yt-<taskId>.mp3
    |                                          | <---------------------------------------| Selesai download
    |                                          | Update status task -> "completed"       |
    |                                          |                                         |
    | 5. Polling GET /api/youtube/status/:id   |                                         |
    |----------------------------------------->| Cek status di task store                |
    |    Response: status: "completed"         |                                         |
    |<-----------------------------------------|                                         |
    |                                          |                                         |
    | 6. GET /api/youtube/download/:task_id    |                                         |
    |----------------------------------------->| Kirim file via res.download() --------> |
    | 7. File MP3 terunduh                     |                                         |
    |<-----------------------------------------| Di callback res.download():             |
    |                                          | Hapus file MP3 (/temp) ---------------> | 8. Hapus file fisik (fs.unlink)
```

---

## 5. Komponen & Alur Implementasi

### 5.1. Route (`backend/modules/youtube/youtube.routes.js`)
Definisikan 3 rute:
```javascript
router.post('/download-audio', youtubeController.requestAudioDownload);
router.get('/status/:taskId', youtubeController.getTaskStatus);
router.get('/download/:taskId', youtubeController.downloadAudioFile);
```

### 5.2. Service (`backend/modules/youtube/youtube.service.js`)
1. **Task Store**:
   - Gunakan `Map` in-memory atau tabel `task_histories` untuk melacak status task:
     `{ taskId, url, title, duration, status: 'processing'|'completed'|'failed', outputPath, error, createdAt }`.
2. **Fungsi `createAudioTask(url)`**:
   - Generate `taskId` via `uuidv4()`.
   - Simpan task dengan status `'processing'`.
   - Jalankan `processYoutubeDownload(taskId, url)` di latar belakang (**tanpa `await`**).
   - Kembalikan `{ taskId, status: 'processing' }`.
3. **Fungsi Background `processYoutubeDownload(taskId, url)` (Two-Step Execution)**:
   - **Tahap 1 (Fetch Metadata)**:
     - Jalankan `ytDlp(url, { dumpSingleJson: true, noWarnings: true, preferFreeFormats: true })`.
     - Ambil `duration` (detik) dan `title`.
   - **Tahap 2 (Validasi & Download Audio)**:
     - Jika `duration > 900` (melebihi 15 menit):
       - Ubah status task menjadi `'failed'`.
       - Isi pesan error: `"Durasi video melebihi batas maksimal 15 menit (900 detik)"`.
       - Hentikan proses.
     - Jika `duration <= 900`:
       - Tentukan path output: `path.join(tempDir, \`yt-${taskId}.mp3\`)`.
       - Jalankan download audio:
         ```javascript
         await ytDlp(url, {
           extractAudio: true,
           audioFormat: 'mp3',
           output: path.join(tempDir, `yt-${taskId}.%(ext)s`),
           noPlaylist: true,
         });
         ```
       - Update status task menjadi `'completed'`, simpan `outputPath` dan `title`.
   - **Error Handling**:
     - Jika proses gagal/throw error, ubah status task menjadi `'failed'`, simpan pesan error, dan hapus file output jika sempat terbuat.
4. **Fungsi `getTaskStatus(taskId)`**:
   - Ambil data task dari store berdasarkan `taskId`.
5. **Fungsi `cleanupTaskFile(taskId)`**:
   - Hapus `outputPath` dari `/backend/temp` menggunakan `fs.unlink()`.
   - Hapus entri task dari store.

### 5.3. Controller (`backend/modules/youtube/youtube.controller.js`)
1. **`requestAudioDownload`**:
   - Validasi `req.body.url`. Pastikan URL YouTube disertakan.
   - Panggil `youtubeService.createAudioTask(url)`.
   - Kembalikan response `202 Accepted` atau `200 OK` berisi `{ task_id, status }`.
2. **`getTaskStatus`**:
   - Ambil `taskId` dari `req.params.taskId`.
   - Panggil `youtubeService.getTaskStatus(taskId)`.
   - Jika task tidak ditemukan, kembalikan `404 Not Found`.
   - Kembalikan data status task.
3. **`downloadAudioFile`**:
   - Ambil task dari service berdasarkan `taskId`.
   - Validasi jika task belum selesai atau file tidak ditemukan, kembalikan error.
   - Panggil `res.download(task.outputPath, \`${task.title || 'audio'}.mp3\`, (err) => { ... })`.
   - **PENTING**: Di dalam callback `res.download`, panggil `youtubeService.cleanupTaskFile(taskId)` untuk menghapus file MP3 dari `/temp`.

### 5.4. Pendaftaran Rute (`backend/server.js`)
- Aktifkan rute YouTube:
  ```javascript
  app.use('/api/youtube', youtubeRoutes);
  ```

---

## 6. Spesifikasi API & Contoh Request / Response

### 6.1. Endpoint 1: Request Download Audio
- **Method**: `POST`
- **Path**: `/api/youtube/download-audio`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
  ```

**Response Sukses (`202 Accepted` / `200 OK`)**:
```json
{
  "success": true,
  "message": "Permintaan unduh audio berhasil diterima dan sedang diproses.",
  "data": {
    "task_id": "c7a8e521-4f12-4d2a-8b1e-9f3a12345678",
    "status": "processing"
  }
}
```

---

### 6.2. Endpoint 2: Cek Status Task (Polling)
- **Method**: `GET`
- **Path**: `/api/youtube/status/:task_id`

**Response (`Processing`)**:
```json
{
  "success": true,
  "data": {
    "task_id": "c7a8e521-4f12-4d2a-8b1e-9f3a12345678",
    "status": "processing"
  }
}
```

**Response (`Completed`)**:
```json
{
  "success": true,
  "data": {
    "task_id": "c7a8e521-4f12-4d2a-8b1e-9f3a12345678",
    "status": "completed",
    "title": "Rick Astley - Never Gonna Give You Up",
    "duration": 213,
    "download_url": "/api/youtube/download/c7a8e521-4f12-4d2a-8b1e-9f3a12345678"
  }
}
```

**Response (`Failed`)**:
```json
{
  "success": false,
  "data": {
    "task_id": "c7a8e521-4f12-4d2a-8b1e-9f3a12345678",
    "status": "failed",
    "error": "Durasi video melebihi batas maksimal 15 menit (900 detik)"
  }
}
```

---

### 6.3. Endpoint 3: Unduh File Audio
- **Method**: `GET`
- **Path**: `/api/youtube/download/:task_id`

**Response**:
- Status: `200 OK`
- Header: `Content-Disposition: attachment; filename="<Judul Video>.mp3"`
- Header: `Content-Type: audio/mpeg`
- Body: Binary MP3 stream.
- *Catatan: Server otomatis menghapus file MP3 di `/backend/temp` segera setelah transfer selesai.*

---

## 7. Matriks Pengujian Sederhana (Test Cases)

| No | Skenario Uji | Input | Ekspektasi Status | Ekspektasi Hasil |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Happy Path Download Lagu YouTube** | URL YouTube valid dengan durasi < 15 menit (misal: 3 menit) | `200/202` $\rightarrow$ `200` | Task dibuat (`processing`), polling menjadi `completed`, file MP3 terunduh, file di `/temp` terhapus |
| 2 | **URL YouTube Tidak Disertakan** | Body `{}` tanpa URL | `400 Bad Request` | Pesan error URL YouTube wajib disertakan |
| 3 | **Durasi Melebihi Batas (> 15 Menit / 900s)** | URL video YouTube berdurasi 30 menit | `failed` (di polling) | Tahap 1 mendeteksi durasi > 900s, status task menjadi `failed`, download dibatalkan |
| 4 | **URL Tidak Valid / Video Privat / Hapus** | URL tidak valid atau `https://youtube.com/invalid` | `failed` (di polling) | Task gagal pada Tahap 1 dengan pesan error yang sesuai |
| 5 | **Download Task yang Belum Selesai** | `task_id` yang masih status `processing` | `400 Bad Request` | Pesan error file audio masih dalam proses |
| 6 | **Download Task yang Tidak Ditemukan** | `task_id` acak / tidak ada | `404 Not Found` | Pesan error task tidak ditemukan |
| 7 | **Verifikasi Cleanup File Fisik** | Mengunduh file yang sudah `completed` | `200 OK` | File MP3 terunduh ke klien, file di `/backend/temp` dipastikan langsung terhapus via `fs.unlink()` |
