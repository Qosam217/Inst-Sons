# Test Plan: Backend Feature 01 - Merge PDF Unit & Integration Test

Dokumen rencana dan panduan implementasi pengujian otomatis (unit & integration testing) untuk endpoint penggabungan file PDF (`POST /api/pdf/merge`) pada backend Inst Sons.

---

## 1. Deskripsi & Tujuan

Memastikan endpoint `POST /api/pdf/merge` berfungsi sesuai spesifikasi pada [backend-01-merge-pdf.md](file:///d:/project/Inst%20Sons/docs/feature/backend-01-merge-pdf.md), termasuk validasi batasan ukuran, jumlah file, tipe file, dan keutuhan file PDF hasil penggabungan.

---

## 2. Tools & Tech Stack Pengujian

| Komponen | Library / Tool | Keterangan |
| :--- | :--- | :--- |
| **Test Runner** | `node:test` (Bawaan Node.js) | Runner bawaan tanpa dependensi test framework besar |
| **Assertion Library** | `node:assert` (Bawaan Node.js) | Utilitas assertion standar (`assert.strictEqual`, dll) |
| **HTTP Assertion** | `supertest` | Simulasi request multipart/form-data ke Express `app` |
| **Mock PDF Generator** | `pdf-lib` | Membuat file/buffer PDF dummy secara dinamis saat pengujian |

---

## 3. Struktur File Pengujian

- **File Test**: `backend/modules/pdf/pdf.test.js`
- **Konfigurasi Script**: Ditambahkan ke `backend/package.json`:
  ```json
  "scripts": {
    "test": "node --test modules/**/*.test.js"
  }
  ```

---

## 4. Rincian Skenario Pengujian (Test Cases)

### 4.1. Helper Function
Sediakan fungsi pembantu untuk men-generate buffer PDF dummy valid:
```javascript
const { PDFDocument } = require('pdf-lib');

async function createSamplePdf(text = 'Sample Page') {
  const doc = await PDFDocument.create();
  doc.addPage([300, 300]);
  return Buffer.from(await doc.save());
}
```

### 4.2. Matriks Kasus Uji

| No | Nama Kasus Uji | Skenario Input | Ekspektasi Response |
| :---: | :--- | :--- | :--- |
| 1 | **Happy Path: Merge Berhasil** | Upload 2 file PDF valid (`doc1.pdf`, `doc2.pdf`) | - Status `200 OK`<br>- Header `Content-Type: application/pdf`<br>- Buffer response dapat dibuka dengan `PDFDocument.load()` dan memiliki 2 halaman |
| 2 | **Validasi Minimum File** | Upload hanya 1 file PDF | - Status `400 Bad Request`<br>- `success: false`<br>- Pesan error: `"Minimal 2 file PDF diperlukan untuk digabungkan."` |
| 3 | **Validasi Maksimum File** | Upload 6 file PDF sekaligus | - Status `400 Bad Request`<br>- `success: false`<br>- Pesan error batas maksimal 5 file |
| 4 | **Validasi Ukuran per File** | Upload 1 file PDF dummy berukuran > 10 MB (misal 11 MB) | - Status `400 Bad Request`<br>- `success: false`<br>- Pesan error batas ukuran per file |
| 5 | **Validasi Total Ukuran File** | Upload 4 file PDF dummy @ 8 MB (total 32 MB) | - Status `400 Bad Request`<br>- `success: false`<br>- Pesan error total batas ukuran 30 MB |
| 6 | **Validasi Format File** | Upload 1 file PDF dan 1 file `.txt` | - Status `400 Bad Request`<br>- `success: false`<br>- Pesan error format bukan PDF |

---

## 5. Cara Menjalankan Pengujian

1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Jalankan perintah test:
   ```bash
   npm test
   ```

---

## 6. Kriteria Keberhasilan (Acceptance Criteria)

- [ ] Seluruh 6 skenario test case berhasil dijalankan (*all passed*).
- [ ] Tidak ada warning/error memori bocor saat penanganan buffer.
- [ ] Pengujian dapat dijalankan di lingkungan lokal maupun CI/CD pipeline secara otomatis.
