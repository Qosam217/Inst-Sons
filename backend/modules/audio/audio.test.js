process.env.NODE_ENV = 'test';
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../server');
const audioService = require('./audio.service');

// Helper untuk membuat buffer file audio dummy
function createDummyAudioBuffer() {
  // Simple RIFF WAV header buffer (minimal valid wav structure)
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(44100, 24); // Sample rate
  buffer.writeUInt32LE(88200, 28); // Byte rate
  buffer.writeUInt16LE(2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(0, 40);
  return buffer;
}

describe('Audio Convert Feature Tests (/api/audio)', () => {
  const tempDir = path.join(__dirname, '../../temp');

  beforeEach(() => {
    audioService.taskStore.clear();
  });

  afterEach(() => {
    audioService.taskStore.clear();
  });

  test('1. Validasi: Gagal jika file audio tidak dilampirkan', async () => {
    const res = await request(app)
      .post('/api/audio/convert')
      .field('format', 'mp3');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /wajib diunggah/i);
  });

  test('2. Validasi: Gagal jika format target konversi tidak diisi', async () => {
    const dummyAudio = createDummyAudioBuffer();

    const res = await request(app)
      .post('/api/audio/convert')
      .attach('file', dummyAudio, 'sample.wav');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /wajib diisi/i);
  });

  test('3. Validasi: Gagal jika format target tidak valid (misal: "exe", "mp4")', async () => {
    const dummyAudio = createDummyAudioBuffer();

    const res = await request(app)
      .post('/api/audio/convert')
      .attach('file', dummyAudio, 'sample.wav')
      .field('format', 'invalid_format');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Format target tidak valid/i);
  });

  test('4. Happy Path (Upload): Berhasil membuat task dan mengembalikan status processing', async () => {
    const dummyAudio = createDummyAudioBuffer();

    const res = await request(app)
      .post('/api/audio/convert')
      .attach('file', dummyAudio, 'sample.wav')
      .field('format', 'mp3');

    assert.strictEqual(res.statusCode, 202);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.task_id);
    assert.strictEqual(res.body.data.status, 'processing');
    assert.strictEqual(res.body.data.target_format, 'mp3');
  });

  test('5. Polling: Cek status task yang tidak ditemukan (404)', async () => {
    const res = await request(app).get('/api/audio/status/non-existent-task-id');

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /tidak ditemukan/i);
  });

  test('6. Polling: Mengembalikan status processing saat task sedang berjalan', async () => {
    const taskId = 'test-task-processing';
    audioService.taskStore.set(taskId, {
      taskId,
      status: 'processing',
      targetFormat: 'mp3',
      originalName: 'test.wav',
    });

    const res = await request(app).get(`/api/audio/status/${taskId}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'processing');
    assert.strictEqual(res.body.data.task_id, taskId);
  });

  test('7. Polling: Mengembalikan status completed dan download_url saat task selesai', async () => {
    const taskId = 'test-task-completed';
    audioService.taskStore.set(taskId, {
      taskId,
      status: 'completed',
      targetFormat: 'mp3',
      originalName: 'test.wav',
      outputPath: path.join(tempDir, 'dummy.mp3'),
    });

    const res = await request(app).get(`/api/audio/status/${taskId}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'completed');
    assert.strictEqual(res.body.data.download_url, `/api/audio/download/${taskId}`);
  });

  test('8. Polling: Mengembalikan status failed saat task gagal', async () => {
    const taskId = 'test-task-failed';
    audioService.taskStore.set(taskId, {
      taskId,
      status: 'failed',
      targetFormat: 'mp3',
      originalName: 'test.wav',
      error: 'Durasi audio melebihi batas maksimal 8 menit.',
    });

    const res = await request(app).get(`/api/audio/status/${taskId}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.data.status, 'failed');
    assert.match(res.body.data.error, /Durasi audio melebihi/i);
  });

  test('9. Download: Gagal jika task masih berstatus processing (400)', async () => {
    const taskId = 'test-download-processing';
    audioService.taskStore.set(taskId, {
      taskId,
      status: 'processing',
    });

    const res = await request(app).get(`/api/audio/download/${taskId}`);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /masih berjalan/i);
  });

  test('10. Download: Gagal jika task tidak ditemukan (404)', async () => {
    const res = await request(app).get('/api/audio/download/unknown-task-id');

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.success, false);
  });

  test('11. Download & Cleanup: Mengunduh file hasil konversi dan membersihkan file sementara', async () => {
    const taskId = 'test-download-cleanup';
    const testInputFile = path.join(tempDir, `input-${taskId}.wav`);
    const testOutputFile = path.join(tempDir, `output-${taskId}.mp3`);

    fs.writeFileSync(testInputFile, 'dummy input content');
    fs.writeFileSync(testOutputFile, 'dummy converted mp3 content');

    audioService.taskStore.set(taskId, {
      taskId,
      status: 'completed',
      targetFormat: 'mp3',
      originalName: 'mysong.wav',
      inputPath: testInputFile,
      outputPath: testOutputFile,
    });

    const res = await request(app).get(`/api/audio/download/${taskId}`);

    assert.strictEqual(res.statusCode, 200);
    assert.match(res.headers['content-disposition'], /converted-mysong\.mp3/);

    // Beri sedikit delay untuk memastikan callback cleanup res.download selesai dieksekusi
    await new Promise((resolve) => setTimeout(resolve, 100));

    // File input dan output harus sudah terhapus dari disk
    assert.strictEqual(fs.existsSync(testInputFile), false);
    assert.strictEqual(fs.existsSync(testOutputFile), false);
    assert.strictEqual(audioService.taskStore.has(taskId), false);
  });
});
