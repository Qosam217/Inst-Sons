# Implementation Plan: Backend Feature 01 - Merge PDF

Dokumen rencana implementasi untuk endpoint penggabungan file PDF (`POST /api/pdf/merge`) pada backend Inst Sons.

---

## 1. Deskripsi Fitur & Endpoint

Endpoint ini bertujuan untuk menggabungkan beberapa file dokumen PDF menjadi satu file PDF utuh secara efisien di memori (RAM) menggunakan `pdf-lib` dan `multer`.

- **Metode**: `POST`
- **Path**: `/api/pdf/merge`
- **Content-Type**: `multipart/form-data`
- **Field Name**: `files` (array file PDF)

---

## 2. Batasan Fitur (Constraints)

| Parameter | Batasan | Penanganan / Keterangan |
| :--- | :--- | :--- |
| **Format File** | `application/pdf` (ekstensi `.pdf`) | Divalidasi via `fileFilter` Multer |
| **Jumlah File Minimum** | 2 file | Divalidasi pada Controller (`req.files.length >= 2`) |
| **Jumlah File Maksimum** | 5 file | Dibatasi via `upload.array('files', 5)` & Controller |
| **Maks. Ukuran per File** | 10 MB (`10 * 1024 * 1024` bytes) | Dibatasi via `limits.fileSize` Multer |
| **Maks. Total Ukuran** | 30 MB (`30 * 1024 * 1024` bytes) | Divalidasi pada Controller dengan menjumlahkan `size` seluruh file |

---

## 3. Komponen & Alur Implementasi

### 3.1. Route & Middleware (`backend/modules/pdf/pdf.routes.js`)
- Menggunakan `multer.memoryStorage()` agar file diproses langsung di RAM tanpa perlu menulis ke disk temporer.
- Konfigurasi `limits`:
  - `fileSize`: 10 MB per file.
  - `files`: 5 file.
- Konfigurasi `fileFilter` untuk memastikan MIME type adalah `application/pdf` atau nama file berakhiran `.pdf`.
- Mendaftarkan route: `router.post('/merge', upload.array('files', 5), pdfController.mergePdf)`.

### 3.2. Controller (`backend/modules/pdf/pdf.controller.js`)
- Memvalidasi jumlah file:
  - Jika `req.files` kosong atau `< 2`, kembalikan `400 Bad Request` (`"Minimal 2 file PDF diperlukan untuk digabungkan."`).
  - Jika `req.files.length > 5`, kembalikan `400 Bad Request`.
- Memvalidasi total ukuran file:
  - Hitung total bytes dari seluruh item `req.files`.
  - Jika `totalSize > 30 MB`, kembalikan `400 Bad Request` (`"Total ukuran semua file melebihi batas maksimal 30 MB."`).
- Memanggil `pdfService.mergePdfs(req.files)`.
- Mengirimkan buffer PDF hasil gabungan dengan header:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="merged.pdf"`

### 3.3. Service (`backend/modules/pdf/pdf.service.js`)
- Menggunakan pustaka `pdf-lib`:
  1. Inisialisasi dokumen baru: `const mergedPdf = await PDFDocument.create();`
  2. Looping setiap file dalam array `files`:
     - Ambil buffer (`file.buffer` atau `fs.readFileSync(file.path)`).
     - Muat dokumen: `const pdfDoc = await PDFDocument.load(fileBuffer);`
     - Salin seluruh indeks halaman: `await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())`
     - Tambahkan halaman ke dokumen gabungan: `mergedPdf.addPage(page)`
  3. Simpan dan kembalikan binary bytes: `await mergedPdf.save()`

### 3.4. Server Integration & Error Handler (`backend/server.js`)
- Mendaftarkan rute modular: `app.use('/api/pdf', pdfRoutes);`
- Menangani error bawaan Multer (`LIMIT_FILE_SIZE`, `LIMIT_FILE_COUNT`, format non-PDF) pada Global Error Handler agar otomatis mengembalikan status `400 Bad Request`.

---

## 4. Contoh Request & Response

### Request
```http
POST /api/pdf/merge HTTP/1.1
Host: localhost:5000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="files"; filename="document1.pdf"
Content-Type: application/pdf

<binary content>
------WebKitFormBoundary
Content-Disposition: form-data; name="files"; filename="document2.pdf"
Content-Type: application/pdf

<binary content>
------WebKitFormBoundary--
```

### Response Sukses (`200 OK`)
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="merged.pdf"

<binary PDF stream>
```

### Response Error (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Minimal 2 file PDF diperlukan untuk digabungkan."
}
```

---

## 5. Matriks Pengujian (Test Cases)

| No | Kasus Uji | Input | Ekspektasi Status | Ekspektasi Hasil |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Happy Path** | 2-5 file PDF valid, total < 30 MB | `200 OK` | File PDF gabungan utuh & valid |
| 2 | **Kurang dari 2 file** | 1 file PDF | `400 Bad Request` | Pesan error validasi minimal file |
| 3 | **Lebih dari 5 file** | 6 file PDF | `400 Bad Request` | Pesan error batas maksimal file |
| 4 | **Ukuran per file > 10 MB** | 1 file 12 MB + 1 file 1 MB | `400 Bad Request` | Pesan error batas ukuran per file |
| 5 | **Total ukuran > 30 MB** | 4 file @ 8 MB (total 32 MB) | `400 Bad Request` | Pesan error total batas ukuran file |
| 6 | **Format Non-PDF** | 1 file PDF + 1 file `.txt` | `400 Bad Request` | Pesan error penolakan format non-PDF |
