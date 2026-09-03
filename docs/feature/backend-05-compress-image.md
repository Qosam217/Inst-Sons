# Implementation Plan: Backend Feature 05 - Compress Image

Dokumen rencana implementasi untuk endpoint kompresi gambar (`POST /api/image/compress`) pada backend Inst Sons.

---

## 1. Deskripsi Fitur & Endpoint

Endpoint ini digunakan untuk mengompresi ukuran file gambar berdasarkan tingkat kompresi yang dipilih (`low`, `medium`, atau `high`). Seluruh proses dilakukan secara sinkron murni di dalam memori (RAM Buffer) menggunakan library **sharp** tanpa penyimpanan file ke direktori `/temp`.

- **Metode**: `POST`
- **Path**: `/api/image/compress`
- **Content-Type**: `multipart/form-data`
- **Body Parameter**:
  - `file`: 1 file gambar yang akan dikompresi (Maksimal 15 MB) — *Wajib*
  - `level`: Level kompresi (`low`, `medium`, `high`) — *Opsional, default: `medium`*

---

## 2. Batasan Fitur (Constraints)

| Parameter | Batasan | Penanganan / Keterangan |
| :--- | :--- | :--- |
| **Jumlah File** | Tepat 1 file gambar | Menggunakan `upload.single('file')` |
| **Format File** | `jpg`, `jpeg`, `png`, `webp`, `avif`, `gif` | Divalidasi via `fileFilter` Multer & Controller |
| **Maks. Ukuran File** | 15 MB (`15 * 1024 * 1024` bytes) | Dibatasi via Multer `limits.fileSize` & validasi Controller |
| **Maks. Resolusi Gambar** | 8000 x 8000 piksel | Divalidasi via metadata `sharp` (`width <= 8000` dan `height <= 8000`) |
| **Penyimpanan File** | In-Memory (Buffer) murni | Menggunakan `multer.memoryStorage()`, dilarang simpan ke disk / `/temp` |
| **Pilihan Level** | `low`, `medium`, `high` | Default: `medium` jika parameter tidak diisi |

---

## 3. Logika Kompresi (Sharp)

### 3.1. Aturan Berdasarkan Level

| Level | Resolusi (Resize) | Quality | Deskripsi |
| :--- | :--- | :---: | :--- |
| **`low`** | Tanpa resize (pertahankan resolusi asli) | 80 | Kompresi ringan, kualitas visual tetap prima |
| **`medium`** *(Default)* | `.resize({ width: 1920, withoutEnlargement: true })` | 60 | Kompresi menengah seimbang (Full HD) |
| **`high`** | `.resize({ width: 1080, withoutEnlargement: true })` | 40 | Kompresi maksimal, ukuran file paling kecil |

### 3.2. Pembersihan Metadata
- Metadata asli (EXIF, orientasi, dsb.) secara otomatis tidak disertakan/dihapus oleh `sharp` (tanpa memanggil `.withMetadata()`) guna memaksimalkan penurunan ukuran file.

---

## 4. Komponen & Alur Implementasi

### 4.1. Route & Middleware (`backend/modules/image/image.routes.js`)
- Konfigurasi Multer kompresi dengan `multer.memoryStorage()`:
  - `limits`: `{ fileSize: 15 * 1024 * 1024, files: 1 }` (15 MB, 1 file).
  - `fileFilter`: Hanya menerima tipe MIME gambar (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`).
- Pasang rute:
  ```javascript
  router.post('/compress', uploadCompress.single('file'), imageController.compressImage);
  ```

### 4.2. Controller (`backend/modules/image/image.controller.js`)
1. **Validasi File**: Pastikan `req.file` ada. Jika tidak, kembalikan `400 Bad Request`.
2. **Validasi Ukuran File**: Pastikan `req.file.size <= 15 MB`.
3. **Validasi & Normalisasi Level**:
   - Ambil `req.body.level`.
   - Jika tidak diisi, gunakan nilai default `'medium'`.
   - Jika diisi tetapi bukan salah satu dari `['low', 'medium', 'high']`, kembalikan `400 Bad Request`.
4. **Eksekusi Service**:
   - Panggil `imageService.compressImage(req.file.buffer, level, req.file.mimetype)`.
5. **Kirim Response**:
   - Set header `Content-Type` sesuai MIME type gambar.
   - Set header `Content-Disposition: attachment; filename="compressed.<ext>"`.
   - Kirim buffer hasil kompresi via `res.send(outputBuffer)`.

### 4.3. Service (`backend/modules/image/image.service.js`)
1. **Validasi Resolusi**:
   - Ambil metadata menggunakan `await sharp(buffer).metadata()`.
   - Jika `metadata.width > 8000` atau `metadata.height > 8000`, lempar error `400 Bad Request`.
2. **Setup Pipeline Sharp**:
   - Inisialisasi pipeline: `let pipeline = sharp(buffer);`
   - Terapkan resize sesuai level:
     - `medium`: `pipeline = pipeline.resize({ width: 1920, withoutEnlargement: true });`
     - `high`: `pipeline = pipeline.resize({ width: 1080, withoutEnlargement: true });`
     - `low`: Tidak ada resize.
3. **Terapkan Opsi Format & Kualitas**:
   - Tentukan format output (sesuai format asli atau metadata format, misal `jpeg`, `png`, `webp`, `avif`).
   - Berikan konfigurasi quality (`80` untuk low, `60` untuk medium, `40` untuk high) pada `.toFormat(format, { quality })`.
4. **Generate Buffer**:
   - Eksekusi `const outputBuffer = await pipeline.toBuffer();`
   - Kembalikan `outputBuffer` ke controller.

---

## 5. Contoh Request & Response

### Request
```http
POST /api/image/compress HTTP/1.1
Host: localhost:5000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

<binary content>
------WebKitFormBoundary
Content-Disposition: form-data; name="level"

medium
------WebKitFormBoundary--
```

### Response Sukses (`200 OK`)
```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Disposition: attachment; filename="compressed.jpg"

<binary image stream>
```

### Response Error (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Level kompresi tidak valid. Pilihan yang tersedia: low, medium, high."
}
```

---

## 6. Matriks Pengujian Sederhana (Test Cases)

| No | Skenario Uji | Input | Ekspektasi Status | Ekspektasi Hasil |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Happy Path (Default Medium)** | 1 gambar PNG valid, tanpa parameter `level` | `200 OK` | Gambar terkompresi dengan lebar maks 1920px dan quality 60 |
| 2 | **Happy Path (Low Level)** | 1 gambar JPG valid, `level: "low"` | `200 OK` | Gambar terkompresi dengan resolusi asli dan quality 80 |
| 3 | **Happy Path (High Level)** | 1 gambar WebP valid, `level: "high"` | `200 OK` | Gambar terkompresi dengan lebar maks 1080px dan quality 40 |
| 4 | **File tidak dilampirkan** | Tanpa file gambar | `400 Bad Request` | Pesan error file wajib diunggah |
| 5 | **Ukuran file > 15 MB** | File gambar ukuran 16 MB | `400 Bad Request` | Pesan error ukuran file melebihi batas 15 MB |
| 6 | **Resolusi > 8000x8000** | Gambar resolusi 8500x2000 piksel | `400 Bad Request` | Pesan error resolusi melebihi batas 8000x8000 |
| 7 | **Level tidak valid** | `level: "ultra"` | `400 Bad Request` | Pesan error pilihan level tidak valid |
| 8 | **Format file non-gambar** | File `.pdf` atau `.txt` | `400 Bad Request` | Pesan error format file tidak diperbolehkan |
