const authService = require('./auth.service');

// Helper regex format email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Controller untuk Registrasi User baru (POST /api/auth/register)
 */
async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Username wajib diisi.',
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid atau belum diisi.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password wajib diisi dan minimal terdiri dari 8 karakter.',
      });
    }

    const newUser = await authService.registerUser({
      username: username.trim(),
      email: email.trim(),
      password,
    });

    return res.status(201).json({
      success: true,
      message: 'Pengguna berhasil didaftarkan.',
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller untuk Login User (POST /api/auth/login)
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    const { token, user } = await authService.loginUser({
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller untuk Cek Profile User (GET /api/auth/me)
 */
async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await authService.getUserById(userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
};
