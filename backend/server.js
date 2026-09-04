require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import modular routes
const authRoutes = require('./modules/auth/auth.routes');
const pdfRoutes = require('./modules/pdf/pdf.routes');
const youtubeRoutes = require('./modules/youtube/youtube.routes');
const imageRoutes = require('./modules/image/image.routes');
const audioRoutes = require('./modules/audio/audio.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Core Middlewares
app.use(cors({
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(','),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Inst Sons API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Modular Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/audio', audioRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Rute ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);

  // Penanganan error Multer
  if (err.name === 'MulterError') {
    let message = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Ukuran file melebihi batas maksimal yang diperbolehkan (maksimal 10 MB per file / 20 MB untuk upload).';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
      message = 'Jumlah file melebihi batas maksimal yang diperbolehkan (maksimal 5 file).';
    }
    return res.status(400).json({
      success: false,
      message,
    });
  }

  const statusCode = err.statusCode || (err.message && (err.message.includes('Hanya file format') || err.message.includes('melebihi batas')) ? 400 : 500);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Inst Sons Backend Server berjalan di http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
