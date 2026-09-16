# Implementation Plan: Frontend Feature 04 - Login & Autentikasi Pengguna

Dokumen perencanaan dan panduan implementasi tampilan Login, Global Auth State, dan Route Protection pada frontend Next.js Inst Sons. Dokumen ini dirancang sederhana dan jelas agar mudah diimplementasikan oleh junior programmer atau AI agent.

- **Target Route**: `/login` (dan `/auth` sebagai redirect/alias)
- **Target File Dokumen**: `docs/feature/frontend-04-login-page.md`

---

## 1. Ringkasan & Tujuan

Menyediakan sistem autentikasi menyeluruh di sisi frontend yang mengunci seluruh halaman aplikasi hanya untuk pengguna yang memiliki akun resmi, menyimpan token JWT dari backend, memperbarui tampilan navigasi (Header/Navbar) secara dinamis, serta menyediakan halaman login yang bersih dan terproteksi.

---

## 2. Restriksi & Aturan Penting

1. **Proteksi Penuh Seluruh Halaman (Route Guard)**:
   - Semua path aplikasi (`/`, `/pdf`, `/music`, `/image`, dsb.) **wajib** memeriksa keberadaan token login (`localStorage` atau `Cookie`).
   - Jika token **TIDAK ADA**, pengguna langsung diarahkan (*redirect*) ke halaman `/login`.
2. **Redirect Pasca Login & Header Dinamis**:
   - Setelah login berhasil, pengguna diarahkan ke halaman utama/base (`/`).
   - Tombol **"Masuk"** di Header otomatis berubah menjadi **Username** pengguna yang aktif dan tombol **"Keluar"** (Logout).
3. **Tanpa Fitur Lupa Password**:
   - Halaman login **TIDAK** menyediakan tombol atau tautan "Lupa Password / Forgot Password".
4. **Registrasi Tertutup (Modal Kontak Admin)**:
   - Karena aplikasi bersifat internal/privat, pendaftaran umum ditiadakan.
   - Tombol **"Daftar"** pada halaman login hanya akan memunculkan popup/modal informasi untuk menghubungi email Administrator (`admin@instsons.internal` atau email pengelola) untuk mendapatkan akun kredensial.

---

## 3. Alur Kerja Pengguna (User Flow)

```text
[Pengguna Membuka Web]
         │
         ▼
[Pengecekan Token] ────(Tidak Ada Token)───► [Redirect ke /login]
         │                                            │
    (Ada Token)                                 [Input Email & Password]
         │                                            │
         ▼                                            ▼
[Akses Halaman Utama / Base] ◄──(Login Sukses)── [Simpan Token & User]
[Header Menampilkan Username]
```

1. **Akses Web**: Pengguna membuka URL aplikasi (misal: `http://localhost:3000/` atau `http://localhost:3000/pdf`).
2. **Pengecekan Route Guard**:
   - **Belum Login**: Sistem otomatis me-redirect ke `/login`.
   - **Sudah Login**: Halaman yang diminta dibuka normal.
3. **Halaman Login**:
   - Pengguna mengisi Email dan Kata Sandi, lalu klik "Masuk".
   - Jika pengguna belum punya akun dan klik "Daftar", sistem menampilkan modal/popup instruksi kontak admin.
4. **Pasca-Login**:
   - Sistem menyimpan token JWT & data user ke `localStorage`.
   - State global `AuthContext` diperbarui.
   - Pengguna diarahkan ke halaman base (`/`).
   - Header menampilkan nama pengguna dan opsi Logout.

---

## 4. Integrasi Endpoint Backend

| Endpoint | Method | Payload / Request Body | Response Sukses (200) | Keterangan |
| :--- | :---: | :--- | :--- | :--- |
| `POST /api/auth/login` | `POST` | `{"email": "...", "password": "..."}` | `{"token": "JWT_TOKEN", "user": {"id": 1, "username": "...", "email": "..."}}` | Verifikasi kredensial & mendapatkan token |
| `GET /api/auth/me` *(Opsional)* | `GET` | Headers: `Authorization: Bearer <TOKEN>` | `{"id": 1, "username": "...", "email": "..."}` | Memvalidasi ulang token saat refresh |

---

## 5. Rencana Struktur File & Komponen

```text
frontend/src/
├── context/
│   └── AuthContext.js          # [BARU] Context API untuk state global user, token, login, logout
├── components/
│   ├── AuthGuard.js            # [BARU] Wrapper proteksi rute (redirect ke /login jika belum auth)
│   ├── Navbar.js               # [UPDATE] Menampilkan 'Masuk' atau Username + Tombol Logout
│   └── RegisterInfoModal.js    # [BARU] Modal popup informasi email admin saat klik 'Daftar'
├── app/
│   ├── layout.js               # [UPDATE] Membungkus aplikasi dengan AuthProvider & AuthGuard
│   └── login/
│       └── page.js             # [BARU] Form login bersih (Email, Password, Masuk, Tombol Daftar Modal)
```

---

## 6. Langkah Implementasi Teknis

### Langkah 1: Buat State Global (`src/context/AuthContext.js`)
Buat React Context untuk menyimpan:
- `user`: Data user aktif (`{ id, username, email }` atau `null`).
- `token`: String token JWT.
- `isLoading`: Boolean untuk menandai pengecekan token awal selesai.
- `login(email, password)`: Fungsi async memanggil `POST /api/auth/login`, menyimpan token ke `localStorage`, dan mengupdate state.
- `logout()`: Menghapus token dari `localStorage`, mereset state, dan me-redirect ke `/login`.

### Langkah 2: Buat Route Guard Wrapper (`src/components/AuthGuard.js`)
- Cek apakah route saat ini adalah halaman publik (`/login`).
- Jika halaman saat ini bukan `/login` dan `user` bernilai `null` (serta tidak sedang `isLoading`), langsung redirect ke `/login` menggunakan `useRouter()`.
- Jika sudah login dan membuka `/login`, redirect ke `/`.

### Langkah 3: Update Header Dinamis (`src/components/Navbar.js`)
- Panggil `useAuth()` di `Navbar`.
- **Kondisi Belum Login**: Tampilkan tombol **"Masuk"** mengarah ke `/login`.
- **Kondisi Sudah Login**:
  - Tampilkan icon user + **Username** pengguna.
  - Tampilkan tombol **"Keluar"** (Logout) yang memanggil fungsi `logout()`.

### Langkah 4: Buat Modal Popup Info Daftar (`src/components/RegisterInfoModal.js`)
- Modal sederhana dengan latar belakang backdrop gelap.
- Menampilkan pesan:
  > **Pendaftaran Akun Terbatas**  
  > Sistem ini diperuntukkan untuk kalangan internal. Untuk mendapatkan akun kredensial, silakan kirim permohonan ke administrator melalui email: **admin@instsons.internal**
- Tombol "Tutup".

### Langkah 5: Buat Halaman Login (`src/app/login/page.js`)
- Tampilan form card terpusat (*centered card*) dengan tema Slate & Indigo.
- Form field:
  1. Input **Email**
  2. Input **Kata Sandi**
- Tombol Submit **"Masuk"** (dengan animasi loading saat request berjalan).
- Menampilkan alert merah jika kredensial salah (misal: "Email atau kata sandi salah").
- Teks footer card: *"Belum punya akun? "* + tombol teks *"Daftar di sini"* yang membuka `RegisterInfoModal`.
- **CATATAN**: Jangan tampilkan link "Lupa Password".

### Langkah 6: Hubungkan ke Root Layout (`src/app/layout.js`)
- Bungkus `{children}` di dalam `<AuthProvider>` dan `<AuthGuard>`.

---

## 7. Kriteria Pengujian & Acceptance Criteria

1. [ ] **Proteksi Route**: Membuka URL `http://localhost:3000/`, `/pdf`, `/music`, `/image` saat belum login langsung diarahkan ke `/login`.
2. [ ] **Form Login**:
   - Submit dengan email/password salah menampilkan pesan error.
   - Tidak ada tautan/link "Lupa Password".
3. [ ] **Popup Daftar**: Mengklik "Daftar di sini" membuka popup berisi instruksi kontak email admin.
4. [ ] **Pasca-Login**:
   - Login berhasil menyimpan token & me-redirect ke `/`.
   - Header berubah menampilkan username dan tombol Logout.
5. [ ] **Logout**: Mengklik tombol Logout menghapus data login dan mengarahkan kembali ke `/login`.
