# Implementation Plan: Backend Feature 02 - Split PDF

Dokumen rencana implementasi untuk endpoint pemisahan halaman file PDF (`POST /api/pdf/split`) pada backend Inst Sons.

---

## 1. Deskripsi Fitur & Endpoint

Endpoint ini digunakan untuk memisahkan/mengambil rentang halaman tertentu (`startPage` sampai `endPage`) dari sebuah dokumen PDF. Seluruh proses dilakukan langsung di memori (RAM) tanpa menyimpan file ke direktori `/temp` lokal.

- **Metode**: `POST`
- **Path**: `/api/pdf/split`
- **Content-Type**: `multipart/form-data`
- **Body Parameter**:
  - `file`: 1 file dokumen PDF
  - `startPage`: Nomor halaman awal (integer, 1-based index)
  - `endPage`: Nomor halaman akhir (integer, 1-based index)

---

## 2. Batasan Fitur (Constraints)

| Parameter | Batasan | Penanganan / Keterangan |
| :--- | :--- | :--- |
| **Jumlah File** | Tepat 1 file PDF | Menggunakan `upload.single('file')` |
| **Format File** | `application/pdf` (ekstensi `.pdf`) | Divalidasi via `fileFilter` Multer |
| **Maks. Ukuran Upload** | 20 MB (`20 * 1024 * 1024` bytes) | Dibatasi via `limits.fileSize` pada Multer |
| **Maks. Ukuran File PDF** | 15 MB (`15 * 1024 * 1024` bytes) | Divalidasi pada Controller (`file.size <= 15 MB`) |
| **Maks. Total Halaman Dokumen** | 500 halaman | Divalidasi setelah `PDFDocument.load()` (`pageCount <= 500`) |

---

## 3. Komponen & Alur Implementasi

### 3.1. Route & Middleware (`backend/modules/pdf/pdf.routes.js`)
- Menggunakan `multer.memoryStorage()` agar file diproses di RAM (menghasilkan `req.file.buffer`).
- Set limit Multer: `fileSize: 20 * 1024 * 1024` (20 MB).
- Validasi format file via `fileFilter` (hanya `application/pdf`).
- Rute: `router.post('/split', upload.single('file'), pdfController.splitPdf);`

### 3.2. Controller (`backend/modules/pdf/pdf.controller.js`)
1. **Validasi File**:
   - Pastikan `req.file` ada. Jika tidak ada, kembalikan `400 Bad Request`.
   - Pastikan ukuran file `req.file.size <= 15 * 1024 * 1024` (15 MB). Jika melebihi, kembalikan `400 Bad Request`.
2. **Validasi Parameter Input Halaman**:
   - Ambil `startPage` dan `endPage` dari `req.body` (parsing ke tipe integer).
   - Pastikan keduanya merupakan bilangan bulat positif (`startPage >= 1` dan `endPage >= 1`).
   - Pastikan `startPage <= endPage`. Jika `startPage > endPage`, kembalikan `400 Bad Request`.
3. **Panggil Service**:
   - Kirim `req.file.buffer`, `startPage`, dan `endPage` ke `pdfService.splitPdf()`.
4. **Kirim Response**:
   - Set header `Content-Type: application/pdf` dan `Content-Disposition: attachment; filename="split.pdf"`.
   - Kirim buffer output langsung: `return res.send(Buffer.from(splitBytes))`.

### 3.3. Service (`backend/modules/pdf/pdf.service.js`)
1. **Load Dokumen**:
   - Buka dokumen PDF dari buffer: `const pdfDoc = await PDFDocument.load(fileBuffer);`
2. **Validasi Halaman Dokumen (Sebelum `copyPages`)**:
   - Dapatkan total halaman: `const totalPages = pdfDoc.getPageCount();`
   - Jika `totalPages > 500`, lempar error / kembalikan status `400 Bad Request` ("Dokumen PDF melebihi batas maksimal 500 halaman").
   - Jika `startPage > totalPages` atau `endPage > totalPages`, lempar error / kembalikan status `400 Bad Request` ("Rentang halaman di luar jumlah total halaman dokumen").
3. **Proses Pemisahan Halaman**:
   - Buat dokumen baru: `const newPdf = await PDFDocument.create();`
   - Konversi nomor halaman (1-based) ke indeks array (0-based):
     ```javascript
     const pageIndices = [];
     for (let i = startPage - 1; i < endPage; i++) {
       pageIndices.push(i);
     }
     ```
   - Salin halaman target: `const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);`
   - Tambahkan halaman ke dokumen baru: `copiedPages.forEach((page) => newPdf.addPage(page));`
4. **Simpan dan Kembalikan**:
   - `return await newPdf.save();`

---

## 4. Contoh Request & Response

### Request
```http
POST /api/pdf/split HTTP/1.1
Host: localhost:5000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="sample.pdf"
Content-Type: application/pdf

<binary content>
------WebKitFormBoundary
Content-Disposition: form-data; name="startPage"

2
------WebKitFormBoundary
Content-Disposition: form-data; name="endPage"

4
------WebKitFormBoundary--
```

### Response Sukses (`200 OK`)
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="split.pdf"

<binary PDF stream>
```

### Response Error (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Rentang halaman tidak valid: Halaman akhir melebihi total halaman PDF (total 5 halaman)."
}
```

---

## 5. Matriks Pengujian (Test Cases)

| No | Skenario Uji | Input | Ekspektasi Status | Ekspektasi Hasil |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Happy Path** | 1 PDF valid (5 hal), `startPage: 2`, `endPage: 4` | `200 OK` | File PDF hasil split berisi 3 halaman (hal 2-4) |
| 2 | **Single Page Split** | 1 PDF valid (5 hal), `startPage: 3`, `endPage: 3` | `200 OK` | File PDF hasil split berisi 1 halaman (hal 3) |
| 3 | **File tidak dilampirkan** | Tanpa file PDF | `400 Bad Request` | Pesan error file wajib diunggah |
| 4 | **Ukuran file > 15 MB** | File PDF 16 MB | `400 Bad Request` | Pesan error batas maksimal ukuran file 15 MB |
| 5 | **Total halaman > 500** | File PDF dengan 501 halaman | `400 Bad Request` | Pesan error batas maksimal 500 halaman |
| 6 | **startPage > endPage** | `startPage: 5`, `endPage: 2` | `400 Bad Request` | Pesan error urutan halaman tidak valid |
| 7 | **Halaman di luar batas** | PDF 5 hal, `startPage: 1`, `endPage: 10` | `400 Bad Request` | Pesan error halaman melebihi total halaman PDF |
| 8 | **Input non-angka / negatif**| `startPage: 0` atau `startPage: -1` | `400 Bad Request` | Pesan error format nomor halaman tidak valid |
| 9 | **Format Non-PDF** | File `.docx` / `.jpg` | `400 Bad Request` | Pesan error format file ditolak |
