process.env.NODE_ENV = 'test';
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../server');
const youtubeService = require('./youtube.service');

describe('YouTube Music Downloader Feature Tests (/api/youtube)', () => {
  const tempDir = path.join(__dirname, '../../temp');

  beforeEach(() => {
    youtubeService.taskStore.clear();
  });

  afterEach(() => {
    youtubeService.taskStore.clear();
  });

  test('1. Validasi: Gagal jika URL YouTube tidak disertakan di body (400)', async () => {
    const res = await request(app)
      .post('/api/youtube/download-audio')
      .send({});

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /URL YouTube wajib disertakan/i);
  });

  test('2. Validasi: Gagal jika URL YouTube berupa string kosong (400)', async () => {
    const res = await request(app)
      .post('/api/youtube/download-audio')
      .send({ url: '   ' });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /URL YouTube wajib disertakan/i);
  });

  test('3. Happy Path (Request): Berhasil membuat task dan mengembalikan status processing', async () => {
    const res = await request(app)
      .post('/api/youtube/download-audio')
      .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });

    assert.strictEqual(res.statusCode, 202);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.task_id);
    assert.strictEqual(res.body.data.status, 'processing');
  });

  test('4. Polling: Cek status task yang tidak ditemukan (404)', async () => {
    const res = await request(app).get('/api/youtube/status/non-existent-task-id');

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /tidak ditemukan/i);
  });

  test('5. Polling: Mengembalikan status processing saat task sedang berjalan', async () => {
    const taskId = 'test-yt-processing';
    youtubeService.taskStore.set(taskId, {
      taskId,
      status: 'processing',
      url: 'https://youtu.be/sample',
    });

    const res = await request(app).get(`/api/youtube/status/${taskId}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'processing');
    assert.strictEqual(res.body.data.task_id, taskId);
  });

  test('6. Polling: Mengembalikan status completed, metadata, dan download_url saat task selesai', async () => {
    const taskId = 'test-yt-completed';
    youtubeService.taskStore.set(taskId, {
      taskId,
      status: 'completed',
      title: 'Rick Astley - Never Gonna Give You Up',
      duration: 213,
      outputPath: path.join(tempDir, 'dummy-yt.mp3'),
    });

    const res = await request(app).get(`/api/youtube/status/${taskId}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'completed');
    assert.strictEqual(res.body.data.title, 'Rick Astley - Never Gonna Give You Up');
    assert.strictEqual(res.body.data.duration, 213);
    assert.strictEqual(res.body.data.download_url, `/api/youtube/download/${taskId}`);
  });

  test('7. Polling: Mengembalikan status failed saat durasi melebihi 15 menit', async () => {
    const taskId = 'test-yt-failed';
    youtubeService.taskStore.set(taskId, {
      taskId,
      status: 'failed',
      error: 'Durasi video melebihi batas maksimal 15 menit (900 detik).',
    });

    const res = await request(app).get(`/api/youtube/status/${taskId}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.data.status, 'failed');
    assert.match(res.body.data.error, /melebihi batas maksimal 15 menit/i);
  });

  test('8. Download: Gagal jika task masih berstatus processing (400)', async () => {
    const taskId = 'test-yt-dl-processing';
    youtubeService.taskStore.set(taskId, {
      taskId,
      status: 'processing',
    });

    const res = await request(app).get(`/api/youtube/download/${taskId}`);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /masih berjalan/i);
  });

  test('9. Download: Gagal jika task tidak ditemukan (404)', async () => {
    const res = await request(app).get('/api/youtube/download/unknown-task-id');

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.success, false);
  });

  test('10. Download & Cleanup: Mengunduh file MP3 dan membersihkan file sementara', async () => {
    const taskId = 'test-yt-dl-cleanup';
    const testOutputFile = path.join(tempDir, `yt-${taskId}.mp3`);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(testOutputFile, 'dummy youtube mp3 audio content');

    youtubeService.taskStore.set(taskId, {
      taskId,
      status: 'completed',
      title: 'Sample Song Title',
      duration: 180,
      outputPath: testOutputFile,
    });

    const res = await request(app).get(`/api/youtube/download/${taskId}`);

    assert.strictEqual(res.statusCode, 200);
    assert.match(res.headers['content-disposition'], /Sample Song Title\.mp3/);

    // Delay singkat untuk memastikan event callback res.download selesai dieksekusi
    await new Promise((resolve) => setTimeout(resolve, 100));

    // File MP3 harus sudah terhapus dari folder temp dan task store
    assert.strictEqual(fs.existsSync(testOutputFile), false);
    assert.strictEqual(youtubeService.taskStore.has(taskId), false);
  });
});
