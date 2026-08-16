# Panduan Scaffolding Proyek: Inst Sons (Modular Monolith)

Dokumen ini adalah instruksi kerja tingkat tinggi (*High-Level Scaffolding Guide*) untuk programmer atau agen AI eksekutor dalam membangun struktur awal (*boilerplate & scaffolding*) dari proyek **Inst Sons** berdasarkan `Project-Planning.md`.

---

## 📌 Ringkasan Arsitektur & Strategi

* **Pola Arsitektur:** Monorepo dengan pendekatan *Modular Monolith*.
* **Frontend:** Next.js (App Router `/src/app`), React, Tailwind CSS (Target Deploy: Vercel).
* **Backend:** Node.js, Express.js (Target Deploy: Fly.io via Docker).
* **Database:** PostgreSQL (Tabel: `users`, `task_histories`).
* **Sistem File Sementara:** Folder `/backend/temp` untuk pemrosesan file (ephemeral).

---

## 🗂️ Target Struktur Direktori

```text
inst-sons/
├── .gitignore
├── README.md
├── Project-Planning.md
├── SCAFFOLDING-GUIDE.md
│
├── frontend/                        # Target Deployment: Vercel
│   ├── src/
│   │   ├── app/                     # Next.js App Router
│   │   │   ├── layout.js
│   │   │   ├── page.js              # Landing page (katalog tools)
│   │   │   ├── auth/                # Halaman login & register
│   │   │   ├── pdf/                 # Halaman PDF Merge & Split
│   │   │   ├── music/               # Halaman YouTube & Audio Tools
│   │   │   └── image/               # Halaman Image Compress & Convert
│   │   ├── components/              # UI Components Reusable (Navbar, Footer, Dropzone, dll.)
│   │   └── services/
│   │       └── api.js               # Instance Axios terpusat
│   ├── .env.local.example
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/                         # Target Deployment: Fly.io
    ├── Dockerfile                   # Wajib instalasi Node.js, Python3, dan FFmpeg
    ├── fly.toml                     # Konfigurasi Fly.io
    ├── .dockerignore
    ├── .env.example
    ├── package.json
    ├── server.js                    # Entry point Express, CORS, router utama & health check
    │
    ├── temp/                        # Folder file sementara (sertakan .gitkeep)
    ├── database/
    │   └── schema.sql               # Skema DDL tabel PostgreSQL
    │
    ├── core/                        # Konfigurasi & middleware global
    │   ├── db.js                    # Koneksi database pool (pg)
    │   └── auth.middleware.js       # Middleware verifikasi JWT Bearer token
    │
    └── modules/                     # Modular Monolith Domain (Pola Controller - Service - Routes)
        ├── auth/                    # auth.controller.js, auth.service.js, auth.routes.js
        ├── pdf/                     # pdf.controller.js, pdf.service.js, pdf.routes.js
        ├── youtube/                 # youtube.controller.js, youtube.service.js, youtube.routes.js
        ├── image/                   # image.controller.js, image.service.js, image.routes.js
        └── audio/                   # audio.controller.js, audio.service.js, audio.routes.js
```

---

## 🚀 Tahapan Eksekusi Scaffolding

Ikuti langkah-langkah di bawah ini secara berurutan:

### Langkah 1: Setup Monorepo Root & Git

1. Buat file `.gitignore` pada root direktori:
   * Abaikan: `node_modules/`, `.next/`, `dist/`, `.env*` (kecuali `.env.example`), `.DS_Store`, log files, dan `backend/temp/*` (kecuali `!backend/temp/.gitkeep`).

---

### Langkah 2: Scaffolding Backend (Node.js / Express)

1. **Inisialisasi `package.json` di `/backend`**:
   * **Dependencies:**
     * Web & Utility: `express`, `cors`, `dotenv`, `multer`, `uuid`
     * Keamanan & Auth: `bcrypt`, `jsonwebtoken`
     * Database: `pg`
     * Pemrosesan Media/File: `pdf-lib`, `sharp`, `fluent-ffmpeg`, `yt-dlp-exec`
   * **Dev Dependencies:** `nodemon`
   * **Scripts:**
     * `"start": "node server.js"`
     * `"dev": "nodemon server.js"`

2. **Buat file `.env.example` di `/backend`**:
   * Definisikan key: `PORT=5000`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN=http://localhost:3000`, `TEMP_DIR=./temp`.

3. **Buat file `server.js`**:
   * Inisialisasi Express app.
   * Aktifkan middleware: `cors()`, `express.json()`, `express.urlencoded({ extended: true })`.
   * Buat endpoint health check: `GET /api/health` yang mengembalikan status `200 OK` dan pesan status server.
   * Daftarkan route placeholder untuk modul-modul di `/api/...`.
   * Tambahkan global error handling middleware.

4. **Buat folder `/backend/temp`**:
   * Buat file `.gitkeep` di dalamnya agar direktori terlacak di Git.

5. **Buat file `/backend/core/`**:
   * `db.js`: Setup instance `Pool` dari package `pg` menggunakan variabel `DATABASE_URL`.
   * `auth.middleware.js`: Kerangka middleware untuk mengecek header `Authorization: Bearer <token>` menggunakan `jsonwebtoken`.

6. **Buat folder `/backend/modules/`**:
   * Untuk masing-masing modul (`auth`, `pdf`, `youtube`, `image`, `audio`), buat kerangka 3 file:
     * `<modul>.controller.js` (Handler request & response HTTP dasar)
     * `<modul>.service.js` (Placeholder pemrosesan logika bisnis)
     * `<modul>.routes.js` (Definisi router Express untuk modul terkait)

---

### Langkah 3: Setup Database Schema

1. Buat file `/backend/database/schema.sql` yang memuat DDL skema PostgreSQL:
   * **Tabel `users`**:
     * `id SERIAL PRIMARY KEY`
     * `username VARCHAR(256) NOT NULL`
     * `email VARCHAR(256) UNIQUE NOT NULL`
     * `password VARCHAR(256) NOT NULL`
     * `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
     * `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
   * **Tabel `task_histories`**:
     * `id SERIAL PRIMARY KEY`
     * `module VARCHAR(50) NOT NULL`
     * `status VARCHAR(20) NOT NULL`
     * `file_size_in BIGINT`
     * `file_size_out BIGINT`
     * `user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`
     * `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
     * `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### Langkah 4: Scaffolding Deployment Backend (Docker & Fly.io)

1. **Buat `/backend/Dockerfile`**:
   * Gunakan base image Linux (contoh: `node:20-bullseye-slim` atau sejenis).
   * **Wajib**: Jalankan instalasi dependensi sistem sebelum `npm install`:
     ```dockerfile
     RUN apt-get update && apt-get install -y ffmpeg python3 && rm -rf /var/lib/apt/lists/*
     ```
   * Salin `package*.json`, jalankan `npm install --omit=dev`.
   * Salin seluruh source code backend.
   * Expose port aplikasi (misal `5000` atau `8080`) dan jalankan `CMD ["npm", "start"]`.

2. **Buat `/backend/.dockerignore`**:
   * Abaikan `node_modules`, `temp/*`, `.env`, `.git`.

3. **Buat `/backend/fly.toml`**:
   * Konfigurasi app name, alokasi port internal, dan health check endpoint untuk Fly.io.

---

### Langkah 5: Scaffolding Frontend (Next.js & Tailwind)

1. **Inisialisasi Project Next.js di `/frontend`**:
   * Gunakan App Router (`/src/app`) dan konfigurasi Tailwind CSS.
2. **Install Frontend Dependencies**:
   * `axios`, `lucide-react`, `react-dropzone`, `tailwind-merge`, `clsx`
3. **Buat `/frontend/.env.local.example`**:
   * Berisi `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
4. **Buat `/frontend/src/services/api.js`**:
   * Konfigurasi Axios instance terpusat dengan `baseURL: process.env.NEXT_PUBLIC_API_URL`.
5. **Buat Struktur Halaman Dasar (`/src/app`)**:
   * `page.js`: Halaman beranda (Dashboard/Grid kartu alat: PDF, Audio/YouTube, Gambar).
   * `/auth/page.js`: Kerangka tampilan Login & Registrasi.
   * `/pdf/page.js`: Kerangka tampilan PDF Merge & Split.
   * `/music/page.js`: Kerangka tampilan YouTube Downloader & Audio Converter.
   * `/image/page.js`: Kerangka tampilan Image Compressor & Converter.
6. **Buat Komponen UI Reusable di `/src/components`**:
   * `Navbar.js`, `Footer.js`, `FileDropzone.js`, `Button.js`, `Card.js`.

---

## ✅ Kriteria Verifikasi Scaffolding (Checklist Selesai)

Sebelum melanjutkan ke tahap coding fitur/logika bisnis, pastikan:

* [ ] Struktur direktori `/backend` dan `/frontend` telah dibuat sesuai target.
* [ ] Menjalankan `npm run dev` pada `/backend` berjalan normal tanpa error, dan endpoint `GET http://localhost:5000/api/health` mengembalikan respons JSON status OK.
* [ ] Menjalankan `npm run dev` pada `/frontend` dapat diakses di browser (`http://localhost:3000`) dan navigasi antar halaman berfungsi.
* [ ] File `Dockerfile` di `/backend` menyertakan instalasi `ffmpeg` dan `python3`.
* [ ] File `schema.sql` tersedia dan sesuai dengan definisi tabel di `Project-Planning.md`.
