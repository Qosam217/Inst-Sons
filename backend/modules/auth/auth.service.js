const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../core/db');

const JWT_SECRET = process.env.JWT_SECRET || 'inst-sons-secret-jwt-key-2026';
const SALT_ROUNDS = 10;

/**
 * Service untuk registrasi user baru
 */
async function registerUser({ username, email, password }) {
  // Cek apakah email sudah terdaftar
  const existingUser = await db.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (existingUser.rows.length > 0) {
    const error = new Error('Email sudah terdaftar. Silakan gunakan email lain.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password menggunakan bcrypt dengan salt rounds = 10
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Simpan data user ke database
  const result = await db.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
    [username.trim(), email.trim().toLowerCase(), hashedPassword]
  );

  return result.rows[0];
}

/**
 * Service untuk verifikasi kredensial user & pembuatan JWT token
 */
async function loginUser({ email, password }) {
  // Cari user berdasarkan email
  const result = await db.query(
    'SELECT id, username, email, password FROM users WHERE LOWER(email) = LOWER($1)',
    [email.trim()]
  );

  if (result.rows.length === 0) {
    const error = new Error('Email atau password salah.');
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];

  // Verifikasi password hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Email atau password salah.');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token dengan payload { userId: user.id } dan masa berlaku 1 hari (1d)
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: '1d',
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  };
}

/**
 * Service untuk mendapatkan detail profile user berdasarkan ID
 */
async function getUserById(userId) {
  const result = await db.query(
    'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Pengguna tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
