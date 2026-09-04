# Implementation Plan: Backend Feature 08 - User Management & Authentication

Dokumen rencana implementasi untuk endpoint manajemen pengguna dan autentikasi (`Register`, `Login`, dan `Auth Middleware`) pada backend Inst Sons.

---

## 1. Deskripsi Fitur & Endpoint

Fitur User Management menyediakan autentikasi pengguna berbasis JSON Web Token (JWT) dan penyimpanan data pengguna secara aman ke database PostgreSQL. Fitur ini mencakup:
1. **Signup / Register**: Pendaftaran akun pengguna baru dengan enkripsi password.
2. **Login**: Verifikasi kredensial pengguna dan pembuatan token JWT.
3. **Auth Middleware**: Proteksi route backend dengan memverifikasi token JWT dari header request.

### Daftar Endpoint:
- **POST** `/api/auth/register` - Mendaftarkan pengguna baru.
- **POST** `/api/auth/login` - Masuk dan mendapatkan JWT token.
- **GET** `/api/auth/me` *(Opsional/Helper)* - Mendapatkan profil pengguna saat ini menggunakan token.

---

## 2. Aturan & Batasan Fitur (Constraints)

| Parameter / Item | Aturan / Batasan | Keterangan & Penanganan |
| :--- | :--- | :--- |
| **Username** | Wajib diisi, string (maks. 256 karakter) | Divalidasi di controller / service |
| **Email** | Format email valid, unik (belum terdaftar) | Validasi regex email & cek duplikasi ke tabel `users` |
| **Password** | Minimal 8 karakter, plain text | Divalidasi panjangnya sebelum di-hash |
| **Password Hashing** | Menggunakan `bcrypt` dengan **10 salt rounds** | `bcrypt.hash(password, 10)` sebelum disimpan ke DB |
| **Keamanan Data** | **Dilarang keras** mengembalikan password/hash | Password harus di-omit dari response JSON |
| **JWT Payload** | Cukup berisi `{ userId: user.id }` | Dibuat menggunakan `jsonwebtoken` |
| **JWT Expiration** | **1 hari (`1d`)** | Diset pada opsi `jwt.sign(payload, secret, { expiresIn: '1d' })` |
| **Secret Key** | Disimpan di `.env` (`JWT_SECRET`) | Default fallback jika di lokal (misal: development key) |

---

## 3. Komponen & Struktur File

Implementasi dibagi ke dalam file-file berikut:

```text
backend/
├── core/
│   ├── db.js                 # Inisialisasi pool koneksi database PostgreSQL ('pg')
│   └── auth.middleware.js    # Middleware verifikasi Bearer Token JWT
├── modules/
│   └── auth/
│       ├── auth.routes.js     # Definisi route /register, /login, dan /me
│       ├── auth.controller.js # Validasi request dan response handling
│       └── auth.service.js    # Logika bisnis: query DB, bcrypt hash, JWT sign
└── server.js                 # Pendaftaran router app.use('/api/auth', authRoutes)
```

---

## 4. Alur Kerja Implementasi

### 4.1. Core Database Pool (`backend/core/db.js`)
- Buat instance `Pool` dari library `pg` menggunakan konfigurasi variabel lingkungan (`DATABASE_URL` atau `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- Ekspor pool atau fungsi query helper agar dapat digunakan oleh service.

### 4.2. Signup / Register (`POST /api/auth/register`)
1. **Controller**:
   - Ambil `username`, `email`, dan `password` dari `req.body`.
   - Validasi input:
     - Pastikan `username`, `email`, dan `password` terisi.
     - Validasi format email menggunakan regex standar.
     - Pastikan `password.length >= 8`.
     - Jika ada yang tidak valid, kembalikan `400 Bad Request`.
2. **Service**:
   - Cek apakah email sudah terdaftar di database (`SELECT id FROM users WHERE email = $1`).
   - Jika sudah ada, lemparkan error duplikasi (dikembalikan sebagai `409 Conflict` atau `400 Bad Request`).
   - Lakukan hashing password menggunakan `bcrypt.hash(password, 10)`.
   - Simpan data ke database:
     ```sql
     INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at;
     ```
3. **Response**:
   - Kembalikan status `201 Created` beserta data user (`id`, `username`, `email`, `created_at`).

---

### 4.3. Login (`POST /api/auth/login`)
1. **Controller**:
   - Ambil `email` dan `password` dari `req.body`.
   - Pastikan kedua field diisi. Jika kosong, kembalikan `400 Bad Request`.
2. **Service**:
   - Cari user berdasarkan email:
     ```sql
     SELECT id, username, email, password FROM users WHERE email = $1;
     ```
   - Jika user tidak ditemukan, kembalikan error `401 Unauthorized` (`"Email atau password salah"`).
   - Bandingkan password input dengan password hash di DB menggunakan `bcrypt.compare(password, user.password)`.
   - Jika tidak cocok, kembalikan error `401 Unauthorized` (`"Email atau password salah"`).
   - Buat JWT Token:
     ```javascript
     const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_secret_key', {
       expiresIn: '1d'
     });
     ```
3. **Response**:
   - Kembalikan status `200 OK` dengan payload token dan data ringkas pengguna:
     ```json
     {
       "success": true,
       "message": "Login berhasil",
       "data": {
         "token": "eyJhbGciOi...",
         "user": {
           "id": 1,
           "username": "johndoe",
           "email": "johndoe@example.com"
         }
       }
     }
     ```

---

### 4.4. Auth Middleware (`backend/core/auth.middleware.js`)
Middleware ini bertugas melindungi route yang membutuhkan autentikasi pengguna.

1. **Ekstraksi Token**:
   - Ambil header `req.headers.authorization`.
   - Periksa apakah header ada dan berformat `Bearer <token>`.
   - Jika tidak ada atau format salah, kembalikan `401 Unauthorized` (`"Akses ditolak. Token tidak disediakan."`).
2. **Verifikasi Token**:
   - Ekstrak string `<token>`.
   - Verifikasi menggunakan `jwt.verify(token, process.env.JWT_SECRET)`.
   - Jika token tidak valid / kedaluwarsa, kembalikan `401 Unauthorized` (`"Token tidak valid atau telah kedaluwarsa."`).
3. **Lampirkan Data Pengguna**:
   - Jika valid, masukkan objek pengguna ke request:
     ```javascript
     req.user = { id: decoded.userId };
     ```
   - Panggil `next()` agar request diteruskan ke controller berikutnya.
4. **Pemanfaatan di Modul Lain**:
   - Controller modul lain (seperti PDF, Audio, Image, atau Task History logger) dapat membaca `req.user?.id` untuk mencatat `user_id` pada tabel `task_histories`.

---

## 5. Contoh Request & Response

### 5.1. Register Pengguna
**Request:**
```http
POST /api/auth/register HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "username": "johndoe",
  "email": "johndoe@example.com",
  "password": "securePassword123"
}
```

**Response Sukses (`201 Created`):**
```json
{
  "success": true,
  "message": "Pengguna berhasil didaftarkan",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "johndoe@example.com",
    "created_at": "2026-09-04T08:00:00.000Z"
  }
}
```

**Response Gagal - Email Terdaftar (`409 Conflict` / `400 Bad Request`):**
```json
{
  "success": false,
  "message": "Email sudah terdaftar. Silakan gunakan email lain."
}
```

---

### 5.2. Login Pengguna
**Request:**
```http
POST /api/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "email": "johndoe@example.com",
  "password": "securePassword123"
}
```

**Response Sukses (`200 OK`):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "johndoe@example.com"
    }
  }
}
```

**Response Gagal - Kredensial Salah (`401 Unauthorized`):**
```json
{
  "success": false,
  "message": "Email atau password salah."
}
```

---

### 5.3. Mengakses Endpoint Terproteksi
**Request:**
```http
GET /api/auth/me HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Sukses (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "johndoe@example.com"
  }
}
```

**Response Gagal - Token Tidak Ada / Tidak Valid (`401 Unauthorized`):**
```json
{
  "success": false,
  "message": "Akses ditolak. Token tidak valid atau tidak disediakan."
}
```

---

## 6. Rencana Pengujian (Testing Plan)

1. **Uji Validasi Input**:
   - Register dengan email tidak valid -> Harap kembalikan `400 Bad Request`.
   - Register dengan password < 8 karakter -> Harap kembalikan `400 Bad Request`.
   - Register dengan email yang sama 2x -> Harap kembalikan error duplikasi.
2. **Uji Keamanan**:
   - Pastikan hash password tersimpan di database dengan prefix bcrypt `$2b$10$...`.
   - Pastikan response register dan login tidak mengandung field `password`.
3. **Uji Login**:
   - Login dengan password salah -> Harap kembalikan `401 Unauthorized`.
   - Login dengan data benar -> Harap kembalikan status `200` dan token JWT yang valid.
4. **Uji Middleware**:
   - Request ke endpoint terproteksi tanpa header authorization -> Harap kembalikan `401 Unauthorized`.
   - Request dengan Bearer token yang valid -> Header berhasil dibaca dan `req.user.id` terisi dengan benar.
