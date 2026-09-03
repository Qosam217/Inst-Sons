# Implementation Plan: Backend Feature 03 - Compress PDF

Dokumen rencana implementasi untuk endpoint kompresi file PDF (`POST /api/pdf/compress`) pada backend Inst Sons.

---

## 1. Deskripsi Fitur & Endpoint

Endpoint ini digunakan untuk memperkecil ukuran file PDF dengan menggunakan tool **Ghostscript (`gs`)**. File diunggah ke disk sementara (`/temp`), diproses dengan Ghostscript, dikirimkan kembali ke klien via `res.download()`, lalu kedua file (asli dan hasil) dihapus dari direktori `/temp`.

- **Metode**: `POST`
- **Path**: `/api/pdf/compress`
- **Content-Type**: `multipart/form-data`
- **Body Parameter**:
  - `file`: 1 file dokumen PDF (Maksimal 15 MB)
  - `level`: Level kompresi (`low`, `medium`, `high`) — *Opsional, default: `medium`*

---

## 2. Batasan Fitur (Constraints)

| Parameter | Batasan | Keterangan |
| :--- | :--- | :--- |
| **Jumlah File** | Tepat 1 file PDF | Menggunakan `upload.single('file')` |
| **Format File** | `application/pdf` (ekstensi `.pdf`) | Divalidasi via `fileFilter` Multer |
| **Maks. Ukuran File** | 15 MB (`15 * 1024 * 1024` bytes) | Dibatasi via Multer `limits.fileSize` & validasi Controller |
| **Pilihan Level** | `low`, `medium`, `high` | Default: `medium` jika tidak diisi |

---

## 3. Persiapan & Dependensi OS

### Dockerfile (`backend/Dockerfile`)
Tambahkan paket `ghostscript` ke dalam daftar dependensi OS di `backend/Dockerfile`:
```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ghostscript \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
```

---

## 4. Alur & Logika Kompresi (Ghostscript)

### 4.1. Mapping Opsi Kompresi Ghostscript
Mapping nilai `level` dari request body ke parameter Ghostscript (`-dPDFSETTINGS`):
- `low` $\rightarrow$ `-dPDFSETTINGS=/printer` (Kualitas tinggi, kompresi ringan)
- `medium` $\rightarrow$ `-dPDFSETTINGS=/ebook` (Kualitas standar, kompresi menengah — **Default**)
- `high` $\rightarrow$ `-dPDFSETTINGS=/screen` (Kualitas rendah, ukuran file paling kecil)

### 4.2. Perintah Ghostscript (`gs`)
Jalankan perintah berikut menggunakan `child_process.exec`:
```bash
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=<PDF_SETTING> -dNOPAUSE -dQUIET -dBATCH -sOutputFile="<OUTPUT_PATH>" "<INPUT_PATH>"
```

---

## 5. Komponen Implementasi

### 5.1. Route & Middleware (`backend/modules/pdf/pdf.routes.js`)
- Buat konfigurasi Multer untuk kompresi dengan `multer.diskStorage` ke direktori `backend/temp` (atau gunakan storage yang sudah ada).
- Limit ukuran file: `fileSize: 15 * 1024 * 1024` (15 MB).
- Validasi file filter hanya menerima format PDF (`application/pdf` atau ekstensi `.pdf`).
- Tambahkan rute:
  ```javascript
  router.post('/compress', uploadCompress.single('file'), pdfController.compressPdf);
  ```

### 5.2. Service (`backend/modules/pdf/pdf.service.js`)
- Buat fungsi `compressPdf(inputFilePath, level)`:
  1. Tentukan nilai parameter `-dPDFSETTINGS` berdasarkan `level` (default: `/ebook`).
  2. Buat nama/path file output unik di `/temp` (misalnya: `compressed-<timestamp>-<uuid>.pdf`).
  3. Susun string perintah Ghostscript (`gs ...`).
  4. Eksekusi perintah menggunakan `child_process.exec()` dibungkus dalam Promise.
  5. Kembalikan path file output yang berhasil dibuat.

### 5.3. Controller (`backend/modules/pdf/pdf.controller.js`)
- Buat fungsi `compressPdf(req, res, next)`:
  1. **Validasi File**: Pastikan `req.file` tersedia. Jika tidak, kembalikan response `400 Bad Request`.
  2. **Validasi Level**: Ambil `req.body.level`. Jika diisi, pastikan salah satu dari `['low', 'medium', 'high']`. Jika tidak valid, kembalikan `400 Bad Request`. Jika tidak diisi, gunakan `'medium'`.
  3. **Proses Kompresi**: Panggil `pdfService.compressPdf(inputFilePath, level)`.
  4. **Kirim File & Cleanup**:
     - Kirim file hasil kompresi ke klien menggunakan `res.download(outputPath, 'compressed.pdf', (err) => { ... })`.
     - **WAJIB**: Di dalam callback `res.download`, hapus file input asli dan file output kompresi menggunakan `fs.unlink()` untuk mencegah penumpukan file di folder `/temp`.
     - Jika terjadi error selama proses kompresi, pastikan file input asli yang sudah sempat terunggah tetap dibersihkan (`fs.unlink`).

---

## 6. Contoh Request & Response

### Request
```http
POST /api/pdf/compress HTTP/1.1
Host: localhost:5000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

<binary content>
------WebKitFormBoundary
Content-Disposition: form-data; name="level"

medium
------WebKitFormBoundary--
```

### Response Sukses (`200 OK`)
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="compressed.pdf"

<binary PDF stream>
```

### Response Error (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Level kompresi tidak valid. Pilihan yang tersedia: low, medium, high."
}
```

---

## 7. Matriks Pengujian Sederhana (Test Cases)

| No | Skenario Uji | Input | Ekspektasi Status | Ekspektasi Hasil |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Happy Path (Default Level)** | 1 PDF valid, tanpa parameter `level` | `200 OK` | File PDF hasil terunduh, level otomatis `medium`, file `/temp` terhapus |
| 2 | **Happy Path (Custom Level)** | 1 PDF valid, `level: "high"` | `200 OK` | File PDF hasil terunduh dengan setting `/screen`, file `/temp` terhapus |
| 3 | **File tidak dilampirkan** | Tanpa file PDF | `400 Bad Request` | Pesan error file wajib diunggah |
| 4 | **Ukuran file > 15 MB** | File PDF ukuran 16 MB | `400 Bad Request` | Pesan error batas maksimal ukuran 15 MB |
| 5 | **Level tidak valid** | 1 PDF valid, `level: "ultra"` | `400 Bad Request` | Pesan error level kompresi tidak valid |
| 6 | **Format Non-PDF** | File `.docx` atau `.jpg` | `400 Bad Request` | Pesan error format file ditolak |
