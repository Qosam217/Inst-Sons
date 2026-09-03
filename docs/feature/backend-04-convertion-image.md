# Implementation Plan: Backend Feature 04 - Convert Image

Dokumen rencana implementasi untuk endpoint konversi format gambar (`POST /api/image/convert`) pada backend Inst Sons.

---

## 1. Deskripsi Fitur & Endpoint

Endpoint ini digunakan untuk mengonversi format file gambar ke format yang diinginkan (JPG, JPEG, PNG, WebP, AVIF, atau GIF). Seluruh proses dilakukan langsung di memori (RAM) menggunakan library **sharp** tanpa menyimpan file ke direktori `/backend/temp`.

- **Metode**: `POST`
- **Path**: `/api/image/convert`
- **Content-Type**: `multipart/form-data`
- **Body Parameter**:
  - `file`: 1 file gambar yang akan dikonversi (Maksimal 10 MB)
  - `format`: Format target konversi (`jpg`, `jpeg`, `png`, `webp`, `avif`, `gif`) — *Wajib*

---

## 2. Batasan Fitur (Constraints)

| Parameter | Batasan | Penanganan / Keterangan |
| :--- | :--- | :--- |
| **Jumlah File** | Tepat 1 file gambar | Menggunakan `upload.single('file')` |
| **Format Input & Output** | `jpg`, `jpeg`, `png`, `webp`, `avif`, `gif` | Divalidasi via `fileFilter` Multer & Controller |
| **Maks. Ukuran File** | 10 MB (`10 * 1024 * 1024` bytes) | Dibatasi via Multer `limits.fileSize` |
| **Maks. Resolusi Gambar** | 8192 x 8192 piksel | Divalidasi via metadata `sharp` (`width <= 8192` dan `height <= 8192`) |
| **Penyimpanan File** | In-Memory (Buffer) | Menggunakan `multer.memoryStorage()`, dilarang simpan ke disk |

---

## 3. Komponen & Alur Implementasi

### 3.1. Route & Middleware (`backend/modules/image/image.routes.js`)
- Konfigurasi Multer menggunakan `multer.memoryStorage()`:
  - `limits`: `{ fileSize: 10 * 1024 * 1024 }` (10 MB).
  - `fileFilter`: Hanya mengizinkan mimetype gambar (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`).
- Daftarkan rute:
  ```javascript
  router.post('/convert', uploadMemory.single('file'), imageController.convertImage);
  ```

### 3.2. Controller (`backend/modules/image/image.controller.js`)
1. **Validasi File**:
   - Pastikan `req.file` tersedia. Jika tidak, kembalikan `400 Bad Request`.
2. **Validasi Format Target**:
   - Ambil `req.body.format` (ubah ke lowercase).
   - Pastikan `format` termasuk dalam daftar: `['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']`. Jika tidak valid/kosong, kembalikan `400 Bad Request`.
3. **Panggil Service**:
   - Panggil `imageService.convertImage(req.file.buffer, targetFormat)`.
4. **Kirim Response**:
   - Tentukan MIME type dan ekstensi file hasil konversi.
   - Set header:
     - `Content-Type`: MIME type target (misal `image/png`, `image/webp`, dll.)
     - `Content-Disposition`: `attachment; filename="converted.<ext>"`
   - Kirim buffer hasil konversi via `res.send(outputBuffer)`.

### 3.3. Service (`backend/modules/image/image.service.js`)
1. **Validasi Resolusi**:
   - Ambil metadata menggunakan `sharp(buffer).metadata()`.
   - Periksa apakah `metadata.width > 8192` atau `metadata.height > 8192`. Jika ya, lempar error validasi resolusi melebihi batas maksimal.
2. **Proses Konversi (Sharp)**:
   - Normalize nama format (misal `'jpg'` diarahkan ke `'jpeg'`).
   - Eksekusi konversi ke buffer:
     ```javascript
     const outputBuffer = await sharp(buffer)
       .toFormat(normalizedFormat)
       .toBuffer();
     ```
3. **Kembalikan Buffer**:
   - Kembalikan `outputBuffer` ke controller.

---

## 4. Contoh Request & Response

### Request
```http
POST /api/image/convert HTTP/1.1
Host: localhost:5000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="sample.png"
Content-Type: image/png

<binary content>
------WebKitFormBoundary
Content-Disposition: form-data; name="format"

webp
------WebKitFormBoundary--
```

### Response Sukses (`200 OK`)
```http
HTTP/1.1 200 OK
Content-Type: image/webp
Content-Disposition: attachment; filename="converted.webp"

<binary image stream>
```

### Response Error (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Format target tidak valid. Format yang didukung: jpg, jpeg, png, webp, avif, gif."
}
```

---

## 5. Matriks Pengujian Sederhana (Test Cases)

| No | Skenario Uji | Input | Ekspektasi Status | Ekspektasi Hasil |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Happy Path Konversi** | 1 gambar PNG valid, `format: "webp"` | `200 OK` | File gambar WebP terunduh langsung dari buffer |
| 2 | **Pilihan Format Lain** | 1 gambar JPG valid, `format: "avif"` | `200 OK` | File gambar AVIF terunduh |
| 3 | **File tidak dilampirkan** | Tanpa file gambar | `400 Bad Request` | Pesan error file wajib diunggah |
| 4 | **Ukuran file > 10 MB** | File gambar 11 MB | `400 Bad Request` | Pesan error ukuran file melebihi 10 MB |
| 5 | **Resolusi > 8192x8192** | Gambar resolusi 9000x4000 piksel | `400 Bad Request` | Pesan error resolusi melebihi batas 8192x8192 |
| 6 | **Format target tidak valid** | `format: "bmp"` atau `format: "pdf"` | `400 Bad Request` | Pesan error format target tidak didukung |
| 7 | **Format target kosong** | Tanpa parameter `format` | `400 Bad Request` | Pesan error format target wajib diisi |
| 8 | **Format file input non-gambar** | File `.pdf` atau `.txt` | `400 Bad Request` | Pesan error format file input ditolak |
