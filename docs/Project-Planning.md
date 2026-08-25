
---

# Master Project Plan: Inst Sons

**Deskripsi Project:**
Inst Sons (dari kata *instrumenta personalia* atau *personal tools*) adalah aplikasi web berbasis *Modular Monolith* yang menyediakan berbagai perkakas digital untuk membantu produktivitas pengguna.

**Strategi Deployment (Split Deployment):**

* **Frontend:** Vercel (Serverless Next.js)
* **Backend:** Fly.io (Docker Containerized Node.js API)
* **Database:** PostgreSQL (Bisa menggunakan Supabase, Neon, atau database bawaan Fly.io)

### 1. Fitur Utama

1. **PDF Tools:** Merge (menggabungkan) dan Split (memisahkan) file PDF.
2. **Music Tools:** Download audio dari video YouTube dan konversi format audio.
3. **Image Tools:** Compress ukuran gambar dan konversi format gambar (misal: JPG ke WebP).
4. **Autentikasi User:** Sistem pendaftaran dan login menggunakan bcrypt (untuk hashing password) dan JWT (JSON Web Token) untuk manajemen sesi.
5. **Manajemen File Sementara:** Menyimpan file yang sedang diproses pada direktori `/backend/temp` dan memiliki mekanisme *cleanup* otomatis (menghapus file setelah berhasil dikirim ke klien atau setelah batas waktu tertentu).

### 2. Tech Stack & Library

**Tumpukan Teknologi:**

* **Frontend:** NextJS (menggunakan App Router `/app`), ReactJS, Tailwind CSS.
* **Backend:** NodeJS, ExpressJS (Arsitektur MVC - Modular Monolith).
* **Database:** PostgreSQL.

**Daftar Pustaka (Library):**

* **Backend (Node.js):** `express`, `multer` (penanganan form-data/upload), `pdf-lib` (manipulasi PDF di RAM), `yt-dlp-exec` (YouTube downloader), `sharp` (pemrosesan gambar), `fluent-ffmpeg` (konversi media), `pg` (driver database), `cors`, `dotenv`, `bcrypt`, `jsonwebtoken`, `uuid`.
* **Frontend (Next.js):** `axios` (HTTP client), `lucide-react` (ikon UI), `react-dropzone` (area unggah file), `tailwind-merge` & `clsx` (utilitas standar Tailwind).
* **OS Dependencies (Backend):** `ffmpeg`, `python3` (wajib diinstal via Dockerfile).

### 3. Struktur Direktori Monorepo

```text
/inst-sons-app
├── /frontend                  # Next.js (ReactJS) - Target Vercel
│   ├── /src
│   │   ├── /app               # App Router Next.js (/pdf/merge, /yt/download, dll)
│   │   ├── /components        # UI Components yang re-usable
│   │   └── /services          # Integrasi API (Axios instance)
│   ├── .env.local             # Berisi NEXT_PUBLIC_API_URL (mengarah ke Fly.io)
│   └── package.json           
│
└── /backend                   # Node.js (Express) - Target Fly.io
    ├── /temp                  # Folder penyimpanan file sementara (ephemeral storage)
    ├── /core                  # Konfigurasi inti
    │   ├── db.js              # Koneksi PostgreSQL (menggunakan 'pg')
    │   └── auth.middleware.js # Middleware untuk verifikasi JWT
    │
    ├── /modules               # Modular Monolith Domain
    │   ├── /auth              # Register, Login, JWT Generator
    │   ├── /pdf               # pdf.controller.js, pdf.service.js, pdf.routes.js
    │   ├── /youtube           # Pola MVC untuk download yt-dlp
    │   ├── /image             # Pola MVC untuk sharp compress/convert
    │   └── /audio             # Pola MVC untuk fluent-ffmpeg
    │
    ├── server.js              # Entry point Express, registrasi CORS & Router
    ├── Dockerfile             # WAJIB: Script instalasi Node, Python, dan FFmpeg
    ├── fly.toml               # Konfigurasi deployment Fly.io
    └── package.json

```

### 4. Skema Database (PostgreSQL)

**Tabel `users**`

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(256) NOT NULL,
    email VARCHAR(256) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL, -- Di-hash menggunakan bcrypt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

**Tabel `task_histories**`

```sql
CREATE TABLE task_histories (
    id SERIAL PRIMARY KEY,
    module VARCHAR(50) NOT NULL, -- 'pdf_merge', 'image_compress', 'yt_download' dll.
    status VARCHAR(20) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
    file_size_in BIGINT,         -- Dalam bytes
    file_size_out BIGINT,        -- Dalam bytes
    user_id INTEGER,             -- Relasi ke users.id (bisa nullable jika guest diizinkan)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

```

### 5. Instruksi Khusus untuk AI Agent / Developer

1. **CORS Setup:** Pastikan *backend* Express dikonfigurasi untuk menerima *request* dari *domain frontend* (Vercel) pada *production* dan `localhost` pada tahap *development*.
2. **Dockerfile Requirements:** Buat `Dockerfile` di folder `/backend` menggunakan *base image* Linux (misal: `node:20-bullseye` atau `alpine`), lalu tambahkan perintah `RUN apt-get update && apt-get install -y ffmpeg python3` sebelum melakukan `npm install`.
3. **Storage Cleanup:** Pada modul yang menggunakan direktori `/temp` (khususnya YouTube dan Audio), jalankan `fs.unlink()` setelah `res.download()` atau `res.sendFile()` berhasil dieksekusi agar memori *container* Fly.io tidak penuh.
4. **Error Handling File Besar:** Gunakan batasan ukuran *file* di `multer` dan pastikan memori Node.js tidak *crash* (*Out of Memory*) saat melakukan manipulasi PDF atau Image berbasis Buffer.

---