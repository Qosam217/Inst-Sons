process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-12345';
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const db = require('../../core/db');
const app = require('../../server');

// Mock memory storage untuk database saat testing jika tanpa live PostgreSQL
let inMemoryUsers = [];
let nextUserId = 1;

// Override db.query untuk unit/integration test lingkungan test
db.query = async (text, params = []) => {
  const normalizedText = text.trim();

  // SELECT id FROM users WHERE LOWER(email) = LOWER($1)
  if (normalizedText.includes('FROM users WHERE LOWER(email) = LOWER($1)')) {
    const email = params[0]?.toLowerCase();
    const found = inMemoryUsers.filter(u => u.email.toLowerCase() === email);
    return { rows: found };
  }

  // INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at
  if (normalizedText.startsWith('INSERT INTO users')) {
    const [username, email, password] = params;
    const newUser = {
      id: nextUserId++,
      username,
      email,
      password,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryUsers.push(newUser);
    return {
      rows: [{
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        created_at: newUser.created_at,
      }],
    };
  }

  // SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1
  if (normalizedText.includes('FROM users WHERE id = $1')) {
    const id = Number(params[0]);
    const found = inMemoryUsers.filter(u => u.id === id);
    if (found.length > 0) {
      const { password, ...safeUser } = found[0];
      return { rows: [safeUser] };
    }
    return { rows: [] };
  }

  return { rows: [] };
};

describe('User Management & Auth Feature Tests', () => {
  beforeEach(() => {
    inMemoryUsers = [];
    nextUserId = 1;
  });

  describe('1. Signup / Register Tests (POST /api/auth/register)', () => {
    test('1.1. Happy Path: Berhasil mendaftar user baru', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'johndoe@example.com',
          password: 'password123',
        });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.username, 'johndoe');
      assert.strictEqual(res.body.data.email, 'johndoe@example.com');
      assert.strictEqual(res.body.data.password, undefined); // Password tidak boleh dikembalikan
      assert.ok(res.body.data.id);
    });

    test('1.2. Validasi Email: Gagal jika format email tidak valid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'bukan-email-valid',
          password: 'password123',
        });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /format email tidak valid/i);
    });

    test('1.3. Validasi Password: Gagal jika password < 8 karakter', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'johndoe@example.com',
          password: '12345',
        });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /minimal.*8 karakter/i);
    });

    test('1.4. Validasi Duplikasi: Gagal jika email sudah terdaftar', async () => {
      // Register user pertama
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      // Register user kedua dengan email sama
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      assert.strictEqual(res.statusCode, 409);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /sudah terdaftar/i);
    });
  });

  describe('2. Login Tests (POST /api/auth/login)', () => {
    beforeEach(async () => {
      // Daftarkan 1 user sampel
      const hashedPassword = await bcrypt.hash('secretPassword123', 10);
      inMemoryUsers.push({
        id: 1,
        username: 'activeuser',
        email: 'active@example.com',
        password: hashedPassword,
        created_at: new Date().toISOString(),
      });
    });

    test('2.1. Happy Path: Login berhasil dan mengembalikan token JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'active@example.com',
          password: 'secretPassword123',
        });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.email, 'active@example.com');
      assert.strictEqual(res.body.data.user.password, undefined); // Tidak ada password di response

      // Verifikasi token yang dihasilkan
      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
      assert.strictEqual(decoded.userId, 1);
    });

    test('2.2. Login Gagal: Email tidak terdaftar', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'secretPassword123',
        });

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /email atau password salah/i);
    });

    test('2.3. Login Gagal: Password salah', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'active@example.com',
          password: 'wrongPassword',
        });

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /email atau password salah/i);
    });
  });

  describe('3. Auth Middleware & Protected Route Tests', () => {
    test('3.1. Gagal akses jika tidak mengirimkan Authorization header', async () => {
      const res = await request(app).get('/api/auth/me');

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /token autentikasi tidak disediakan/i);
    });

    test('3.2. Gagal akses jika token tidak valid / rusak', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_ngawur_palsu');

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /token tidak valid/i);
    });

    test('3.3. Berhasil akses dengan token JWT yang valid', async () => {
      // Tambahkan user
      inMemoryUsers.push({
        id: 99,
        username: 'jwtuser',
        email: 'jwt@example.com',
        password: 'hashedpassword',
        created_at: new Date().toISOString(),
      });

      const validToken = jwt.sign({ userId: 99 }, process.env.JWT_SECRET, { expiresIn: '1d' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.id, 99);
      assert.strictEqual(res.body.data.username, 'jwtuser');
      assert.strictEqual(res.body.data.password, undefined);
    });
  });
});
