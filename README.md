# Inst-Sons

## Docker & Container Development

Project ini menggunakan **Docker Compose**. Jika kamu ingin menjalankan perintah terminal (seperti `npm install`, `npm test`, atau mengecek file sistem backend), kamu **WAJIB** mengeksekusinya di dalam container backend menggunakan awalan perintah:

```bash
docker-compose exec backend <perintah>
```

### Contoh Perintah:

- Menjalankan testing:
  ```bash
  docker-compose exec backend npm test
  ```
- Menjalankan test spesifik:
  ```bash
  docker-compose exec backend npm test -- modules/pdf/pdf.test.js
  ```
- Install package baru:
  ```bash
  docker-compose exec backend npm install <nama_package>
  ```
- Akses shell/terminal di dalam container:
  ```bash
  docker-compose exec backend sh
  ```